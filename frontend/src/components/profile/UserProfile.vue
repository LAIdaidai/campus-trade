<template>
  <div class="user-profile">
    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- 头像上传 -->
      <div class="form-section avatar-section">
        <label class="section-label">头像</label>
        <div class="avatar-upload">
          <div class="avatar-preview">
            <img :src="avatarUrl" :alt="form.username" />
            <div class="avatar-overlay">
              <input 
                ref="avatarInput"
                type="file" 
                accept="image/*"
                capture="user"
                @change="handleAvatarChange"
                style="display: none;"
              />
              <button 
                type="button"
                class="btn-upload"
                @click="$refs.avatarInput.click()"
              >
                更换头像
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-section">
        <label class="section-label">基本信息</label>
        
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="请输入用户名"
            required
          />
        </div>

        <div class="form-group">
          <label>邮箱</label>
          <input 
            v-model="form.email" 
            type="email" 
            placeholder="请输入邮箱"
            required
            disabled
          />
          <small class="form-hint">邮箱不可修改</small>
        </div>

        <div class="form-group">
          <label>手机号</label>
          <input 
            v-model="form.phone" 
            type="tel" 
            placeholder="请输入手机号"
          />
        </div>
      </div>

      <!-- 密码修改 -->
      <div class="form-section">
        <label class="section-label">修改密码</label>
        <p class="section-hint">如不需要修改密码,请留空</p>
        
        <div class="form-group">
          <label>当前密码</label>
          <input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            placeholder="请输入当前密码"
          />
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
          />
        </div>

        <div class="form-group">
          <label>确认新密码</label>
          <input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
          />
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { uploadSingleImage } from '@/api/upload'
import { changePassword } from '@/api/user'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'

const userStore = useUserStore()
const avatarInput = ref(null)
const submitting = ref(false)

const form = ref({
  username: '',
  email: '',
  phone: '',
  avatar: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const avatarUrl = computed(() => {
  if (form.value.avatar) {
    const url = getImageUrl(form.value.avatar)
    console.log('UserProfile 组件头像:', {
      原始路径: form.value.avatar,
      转换后URL: url
    })
    return url
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(form.value.username || '用户')}&background=ff2442&color=fff&size=200`
})

// 初始化表单
const initForm = () => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    form.value = {
      username: userInfo.username || '',
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      avatar: userInfo.avatar || ''
    }
  }
}

// 处理头像上传
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast.warning('请选择图片文件')
    return
  }

  // 验证文件大小 (限制5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.warning('图片大小不能超过5MB')
    return
  }

  try {
    // 显示上传中提示
    console.log('正在上传头像...')
    
    // 上传文件
    const response = await uploadSingleImage(file, 'avatars')
    console.log('头像上传响应:', response)
    
    // 处理响应数据 - 兼容不同的响应格式
    let avatarUrl = null
    if (response.data && response.data.url) {
      // 格式: { success: true, data: { url: '/uploads/avatars/xxx.jpg' } }
      avatarUrl = response.data.url
    } else if (response.url) {
      // 格式: { url: '/uploads/avatars/xxx.jpg' }
      avatarUrl = response.url
    }
    
    console.log('解析后的头像URL:', avatarUrl)
    
    if (avatarUrl) {
      // 更新表单中的头像
      form.value.avatar = avatarUrl
      
      // 立即保存到后端和store
      const result = await userStore.updateProfile({
        username: form.value.username,
        phone: form.value.phone,
        avatar: avatarUrl
      })
      
      if (result.success) {
        toast.success('头像更换成功！')
      } else {
        toast.error('头像上传成功，但保存失败: ' + result.message)
      }
    } else {
      console.error('无效的响应数据:', response)
      toast.error('上传失败：未获取到头像URL')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    toast.error('上传失败: ' + (error.message || '请稍后重试'))
  } finally {
    // 清空 input，允许重复选择同一文件
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    submitting.value = true

    // 验证密码
    if (passwordForm.value.newPassword) {
      if (!passwordForm.value.currentPassword) {
        toast.warning('请输入当前密码')
        return
      }
      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        toast.warning('两次输入的新密码不一致')
        return
      }
      if (passwordForm.value.newPassword.length < 6) {
        toast.warning('密码长度不能少于6位')
        return
      }
    }

    // 1) 若填写了新密码，先调用修改密码接口
    if (passwordForm.value.newPassword) {
      try {
        await changePassword({
          current_password: passwordForm.value.currentPassword,
          new_password: passwordForm.value.newPassword
        })
        toast.success('密码修改成功')
      } catch (error) {
        toast.error(error.response?.data?.error || '修改密码失败')
        return
      }
    }

    // 2) 更新基本资料
    const result = await userStore.updateProfile({
      username: form.value.username,
      phone: form.value.phone,
      avatar: form.value.avatar
    })

    if (!result.success) {
      toast.error(result.message || '保存失败')
      return
    }

    toast.success('保存成功!')
    
    // 清空密码表单
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('保存失败:', error)
    toast.error(error.response?.data?.error || '保存失败')
  } finally {
    submitting.value = false
  }
}

// 监听 userStore.userInfo 的变化，自动更新表单
watch(() => userStore.userInfo, (newUserInfo) => {
  if (newUserInfo) {
    form.value = {
      username: newUserInfo.username || '',
      email: newUserInfo.email || '',
      phone: newUserInfo.phone || '',
      avatar: newUserInfo.avatar || ''
    }
  }
}, { deep: true, immediate: true })

onMounted(() => {
  initForm()
})
</script>

<style scoped>
.user-profile {
  width: 100%;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 表单分区 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.section-hint {
  font-size: 14px;
  color: var(--text-tertiary);
  margin: -8px 0 8px 0;
}

/* 头像上传 */
.avatar-section {
  align-items: center;
}

.avatar-upload {
  width: 150px;
  height: 150px;
}

.avatar-preview {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #f0f0f0;
  transition: all var(--transition-base) var(--ease-in-out);
}

.avatar-preview:hover {
  border-color: var(--primary-color);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.btn-upload {
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-upload:hover {
  background: var(--primary-color);
  color: #fff;
  transform: translateY(-2px);
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #d0d0d0;
  border-radius: var(--radius-sm);
  font-size: 15px;
  transition: all var(--transition-base) var(--ease-in-out);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 36, 66, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: -4px;
}

/* 提交按钮 */
.form-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

.btn-submit {
  padding: 14px 60px;
  border-radius: 28px;
  border: none;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 36, 66, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .profile-form {
    gap: 24px;
  }

  .form-section {
    gap: 12px;
  }

  .avatar-upload {
    width: 120px;
    height: 120px;
  }

  .btn-submit {
    width: 100%;
  }
}
</style>
