import { createApp, h, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

/**
 * 显示确认对话框
 * @param {Object} options - 配置选项
 * @param {string} options.title - 标题
 * @param {string} options.message - 消息内容
 * @param {string} options.type - 类型: info, warning, danger, success
 * @param {string} options.confirmText - 确认按钮文字
 * @param {string} options.cancelText - 取消按钮文字
 * @param {boolean} options.showCancel - 是否显示取消按钮
 * @returns {Promise<boolean>} - 返回用户是否确认
 */
export function showConfirm(options = {}) {
  return new Promise((resolve) => {
    const {
      title = '提示',
      message = '',
      type = 'warning',
      confirmText = '确定',
      cancelText = '取消',
      showCancel = true,
      closeOnClickOverlay = true
    } = options

    // 创建挂载点
    const mountNode = document.createElement('div')
    document.body.appendChild(mountNode)

    // 清理函数
    const cleanup = () => {
      app.unmount()
      document.body.removeChild(mountNode)
    }

    let dialogRef = null

    // 创建组件实例
    const app = createApp({
      setup() {
        dialogRef = ref(null)
        return { dialogRef }
      },
      render() {
        return h(ConfirmDialog, {
          ref: 'dialogRef',
          title,
          message,
          type,
          confirmText,
          cancelText,
          showCancel,
          closeOnClickOverlay,
          onConfirm: () => {
            resolve(true)
            cleanup()
          },
          onCancel: () => {
            resolve(false)
            cleanup()
          },
          onClose: () => {
            resolve(false)
            cleanup()
          }
        })
      },
      mounted() {
        // 挂载后显示对话框
        if (this.$refs.dialogRef) {
          this.$refs.dialogRef.show()
        }
      }
    })

    // 挂载组件
    app.mount(mountNode)
  })
}

/**
 * 显示警告对话框
 */
export function showAlert(message, title = '提示', type = 'info') {
  return showConfirm({
    title,
    message,
    type,
    showCancel: false,
    confirmText: '知道了'
  })
}

/**
 * 显示删除确认对话框
 */
export function showDeleteConfirm(message = '确定要删除吗？此操作无法撤销') {
  return showConfirm({
    title: '确认删除',
    message,
    type: 'danger',
    confirmText: '删除',
    cancelText: '取消'
  })
}

/**
 * 显示退出确认对话框
 */
export function showLogoutConfirm(message = '确定要退出登录吗？') {
  return showConfirm({
    title: '退出登录',
    message,
    type: 'warning',
    confirmText: '退出',
    cancelText: '取消'
  })
}

export default {
  showConfirm,
  showAlert,
  showDeleteConfirm,
  showLogoutConfirm
}
