<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-icon" :class="iconType">
            <svg v-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <svg v-else-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg v-else-if="type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h3 class="modal-title">{{ title }}</h3>
        </div>
        
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="showCancel" 
            class="btn btn-cancel" 
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button 
            class="btn btn-confirm" 
            :class="confirmButtonClass"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info', // info, warning, danger, success
    validator: (value) => ['info', 'warning', 'danger', 'success'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  closeOnClickOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const visible = ref(false)

const iconType = computed(() => {
  return `icon-${props.type}`
})

const confirmButtonClass = computed(() => {
  return `btn-${props.type}`
})

const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const handleConfirm = () => {
  emit('confirm')
  hide()
}

const handleCancel = () => {
  emit('cancel')
  hide()
}

const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleCancel()
  }
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  animation: modalBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes modalBounce {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 32px 32px 24px;
  text-align: center;
}

.modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.modal-icon svg {
  width: 32px;
  height: 32px;
}

.modal-icon.icon-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-icon.icon-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.modal-icon.icon-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.modal-icon.icon-success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-body {
  padding: 0 32px 32px;
  text-align: center;
}

.modal-body p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.modal-footer {
  padding: 20px 32px 32px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 100px;
}

.btn-cancel {
  background: #f5f5f5;
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: #e8e8e8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-confirm {
  color: white;
}

.btn-confirm.btn-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-confirm.btn-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.btn-confirm.btn-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
}

.btn-confirm.btn-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.5);
}

.btn-confirm.btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.btn-confirm.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
}

.btn-confirm.btn-success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.btn-confirm.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.5);
}

.btn-confirm:active {
  transform: translateY(0);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.8);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 90vw;
  }

  .modal-header {
    padding: 24px 24px 20px;
  }

  .modal-icon {
    width: 56px;
    height: 56px;
  }

  .modal-icon svg {
    width: 28px;
    height: 28px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-body {
    padding: 0 24px 24px;
  }

  .modal-body p {
    font-size: 14px;
  }

  .modal-footer {
    padding: 16px 24px 24px;
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
