<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <Icon :name="iconName" />
      </div>
      <h1 class="error-title">{{ title }}</h1>
      <p class="error-message">{{ message }}</p>
      <div class="error-actions">
        <button 
          v-if="showRetry" 
          @click="handleRetry" 
          class="btn-retry"
        >
          重试
        </button>
        <button 
          @click="handleGoHome" 
          class="btn-home"
        >
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from './Icon.vue'

const props = defineProps({
  type: {
    type: String,
    default: 'token-expired', // token-expired, network-error, server-error, not-found
    validator: (value) => ['token-expired', 'network-error', 'server-error', 'not-found'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['retry'])

const router = useRouter()

const errorConfig = {
  'token-expired': {
    icon: 'alert-triangle',
    title: '登录已过期',
    message: '您的登录状态已过期，请重新登录'
  },
  'network-error': {
    icon: 'wifi-off',
    title: '网络连接失败',
    message: '请检查网络连接后重试'
  },
  'server-error': {
    icon: 'server',
    title: '服务器错误',
    message: '服务器暂时无法响应，请稍后重试'
  },
  'not-found': {
    icon: 'search',
    title: '页面不存在',
    message: '您访问的页面不存在或已被删除'
  }
}

const config = computed(() => errorConfig[props.type])

const iconName = computed(() => props.title ? 'alert-triangle' : config.value.icon)
const title = computed(() => props.title || config.value.title)
const message = computed(() => props.message || config.value.message)

const handleRetry = () => {
  emit('retry')
}

const handleGoHome = () => {
  if (props.type === 'token-expired') {
    // 清除认证数据
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/auth')
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-gray, #f5f5f5);
}

.error-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.error-icon {
  font-size: 64px;
  color: var(--primary-color, #ff2442);
  margin-bottom: 24px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #333);
  margin: 0 0 12px 0;
}

.error-message {
  font-size: 16px;
  color: var(--text-secondary, #666);
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-retry,
.btn-home {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-retry {
  background: var(--bg-white, #fff);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #ddd);
}

.btn-retry:hover {
  background: var(--bg-gray, #f5f5f5);
  transform: translateY(-1px);
}

.btn-home {
  background: var(--primary-color, #ff2442);
  color: white;
}

.btn-home:hover {
  background: var(--primary-dark, #e01e3c);
  transform: translateY(-1px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .error-page {
    padding: 16px;
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn-retry,
  .btn-home {
    width: 100%;
    max-width: 200px;
  }
}
</style>

