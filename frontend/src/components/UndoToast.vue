<template>
  <Transition name="slide-up">
    <div v-if="visible" class="undo-toast">
      <span class="message">{{ message }}</span>
      <button class="undo-btn" @click="handleUndo">撤回</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: '已删除'
  },
  duration: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['undo'])

const visible = ref(false)
let timer = null

const show = () => {
  visible.value = true
  
  // 清除之前的定时器
  if (timer) {
    clearTimeout(timer)
  }
  
  // 设置自动隐藏
  timer = setTimeout(() => {
    hide()
  }, props.duration)
}

const hide = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const handleUndo = () => {
  emit('undo')
  hide()
}

// 暴露方法给父组件
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.undo-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(48, 49, 51, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  font-size: 14px;
  min-width: 320px;
  max-width: 600px;
  white-space: nowrap;
}

.message {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.undo-btn {
  background: transparent;
  border: none;
  color: #4a9eff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.undo-btn:hover {
  background: rgba(74, 158, 255, 0.1);
}

.undo-btn:active {
  transform: scale(0.95);
}

/* 动画效果 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* iPad 适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .undo-toast {
    min-width: 400px;
    max-width: 500px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .undo-toast {
    bottom: 70px;
    padding: 10px 16px;
    font-size: 13px;
    min-width: 280px;
    max-width: calc(100vw - 40px);
  }
  
  .undo-btn {
    font-size: 13px;
    padding: 4px 10px;
  }
}
</style>
