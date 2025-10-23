import { createApp } from 'vue'
import Toast from '@/components/common/Toast.vue'

let toastInstance = null
let toastContainer = null

export const toast = {
  show(message, type = 'info', duration = 3000) {
    // 如果已有实例，先移除
    if (toastInstance) {
      this.clear()
    }

    // 创建容器
    toastContainer = document.createElement('div')
    document.body.appendChild(toastContainer)

    // 创建组件实例
    toastInstance = createApp(Toast, {
      message,
      type,
      duration,
      onClose: () => {
        this.clear()
      }
    })

    toastInstance.mount(toastContainer)
  },

  success(message, duration = 3000) {
    this.show(message, 'success', duration)
  },

  error(message, duration = 3000) {
    this.show(message, 'error', duration)
  },

  warning(message, duration = 3000) {
    this.show(message, 'warning', duration)
  },

  info(message, duration = 3000) {
    this.show(message, 'info', duration)
  },

  clear() {
    if (toastInstance) {
      toastInstance.unmount()
      toastInstance = null
    }
    if (toastContainer && toastContainer.parentNode) {
      toastContainer.parentNode.removeChild(toastContainer)
      toastContainer = null
    }
  }
}

// 兼容 alert 用法
export function showToast(message, type = 'info') {
  toast.show(message, type)
}

export default toast
