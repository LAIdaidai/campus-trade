<template>
  <div class="reset-password-page">
    <div class="container">
      <div class="reset-box">
        <div class="reset-header">
          <h2>找回密码</h2>
          <p class="subtitle">通过邮箱验证码重置密码</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="message error-message">
          {{ errorMessage }}
        </div>

        <!-- 成功提示 -->
        <div v-if="successMessage" class="message success-message">
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="reset-form">
          <!-- 邮箱输入 -->
          <div class="input-group">
            <label>邮箱地址</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="请输入注册时的邮箱"
              :disabled="loading"
              required
            />
          </div>

          <!-- 验证码输入 -->
          <div class="input-group">
            <label>邮箱验证码</label>
            <EmailCodeInput
              v-model="form.code"
              :email="form.email"
              type="reset-password"
              placeholder="请输入6位验证码"
              :disabled="loading"
              @send="handleSendCode"
            />
          </div>

          <!-- 新密码 -->
          <div class="input-group">
            <label>新密码</label>
            <input
              v-model="form.newPassword"
              type="password"
              placeholder="请输入新密码 (至少6位)"
              :disabled="loading"
              required
            />
          </div>

          <!-- 确认密码 -->
          <div class="input-group">
            <label>确认密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :disabled="loading"
              required
            />
          </div>

          <!-- 提交按钮 -->
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '重置中...' : '重置密码' }}
          </button>

          <!-- 返回登录 -->
          <div class="back-to-login">
            <router-link to="/auth">← 返回登录</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EmailCodeInput from '@/components/EmailCodeInput.vue'
import * as authApi from '@/api/auth'

const router = useRouter()

const form = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 直接发送验证码（无需人机验证）
const handleSendCode = async (email, type) => {
  errorMessage.value = ''
  
  if (!email) {
    errorMessage.value = '请先输入邮箱地址'
    throw new Error('请先输入邮箱地址')
  }

  try {
    await authApi.sendVerificationCode({
      email: email,
      type: type
    })
    successMessage.value = '验证码已发送到您的邮箱,请查收'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('发送验证码错误:', error)
    
    // 根据错误类型给出不同提示
    let errorMsg = '发送失败,请稍后重试'
    
    if (error.code === 'ECONNABORTED') {
      errorMsg = '请求超时，请检查后端服务是否正常运行'
    } else if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      if (status === 404) {
        errorMsg = '该邮箱未注册，请先注册账号'
      } else if (status === 429) {
        errorMsg = data.error || '请求过于频繁，请稍后再试'
      } else if (status === 500) {
        errorMsg = '邮件服务暂时不可用，请联系管理员或稍后重试'
      } else if (data && data.error) {
        errorMsg = data.error
      }
    } else if (error.request) {
      errorMsg = '网络连接失败，请确保后端服务已启动（localhost:3000）'
    }
    
    errorMessage.value = errorMsg
    throw error  // 抛出错误让EmailCodeInput知道发送失败
  }
}

// 提交重置密码
const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 验证
  if (!form.value.email || !form.value.code || !form.value.newPassword || !form.value.confirmPassword) {
    errorMessage.value = '请填写完整信息'
    return
  }

  if (form.value.newPassword.length < 6) {
    errorMessage.value = '密码长度至少为6位'
    return
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  loading.value = true

  try {
    await authApi.resetPassword({
      email: form.value.email,
      code: form.value.code,
      newPassword: form.value.newPassword
    })

    successMessage.value = '密码重置成功!正在跳转到登录页...'
    
    setTimeout(() => {
      router.push('/auth')
    }, 2000)
  } catch (error) {
    errorMessage.value = error.response?.data?.error || '重置失败,请检查验证码是否正确'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  padding: 20px;
  width: 100%;
}

.container {
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: center;
}

.reset-box {
  background: white;
  border-radius: 20px;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.15);
  padding: 40px;
  width: 100%;
  max-width: 500px;
}

.reset-header {
  text-align: center;
  margin-bottom: 30px;
}

.reset-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.message {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  font-size: 14px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.success-message {
  background-color: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

.reset-form {
  width: 100%;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  transition: all var(--transition-base) var(--ease-in-out);
  background: #f9f9f9;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--bg-white);
}

.input-group input:disabled {
  background: var(--bg-dark);
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 36, 66, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.back-to-login {
  text-align: center;
  margin-top: 20px;
}

.back-to-login a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.back-to-login a:hover {
  color: var(--primary-light);
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 768px) {
  .reset-password-page {
    padding: 20px;
    align-items: center;
    justify-content: center;
  }

  .container {
    max-width: 100%;
    width: 100%;
  }

  .reset-box {
    padding: 25px 20px;
    width: 100%;
  }

  .reset-header h2 {
    font-size: 24px;
  }

  .reset-header {
    margin-bottom: 25px;
  }

  .input-group {
    margin-bottom: 18px;
  }

  .input-group input {
    padding: 12px 16px;
    font-size: 14px;
  }

  .submit-btn {
    padding: 12px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .reset-password-page {
    padding: 15px;
    align-items: center;
    justify-content: center;
  }

  .container {
    width: 100%;
  }

  .reset-box {
    padding: 20px 15px;
    border-radius: 15px;
    width: 100%;
  }

  .reset-header h2 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 13px;
  }
}

/* iPad竖屏特殊优化 */
@media (min-width: 481px) and (max-width: 1024px) and (orientation: portrait) {
  .reset-password-page {
    padding: 30px;
  }
  
  .container {
    width: 100%;
    max-width: 600px;
  }
  
  .reset-box {
    width: 100%;
  }
}
</style>
