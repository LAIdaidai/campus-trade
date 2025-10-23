<template>
  <div class="email-code-input">
    <div class="input-wrapper">
      <input
        v-model="localCode"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="6"
        @input="handleInput"
        class="code-input"
      />
      <button
        class="send-code-btn"
        :class="{ disabled: !canSend }"
        :disabled="!canSend"
        @click="handleSend"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  email: { type: String, required: true },
  type: { type: String, default: 'register' }, // 'register' | 'reset-password'
  placeholder: { type: String, default: '请输入验证码' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'send'])

const localCode = ref(props.modelValue)
const countdown = ref(0)
const sending = ref(false)

const canSend = computed(() => {
  return props.email && countdown.value === 0 && !sending.value && !props.disabled
})

const buttonText = computed(() => {
  if (sending.value) return '发送中...'
  if (countdown.value > 0) return `${countdown.value}秒`
  return '获取验证码'
})

const handleInput = () => {
  emit('update:modelValue', localCode.value)
}

const handleSend = async () => {
  if (!canSend.value) return
  
  sending.value = true
  
  try {
    await emit('send', props.email, props.type)
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
  } finally {
    sending.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  localCode.value = newVal
})
</script>

<style scoped>
.email-code-input {
  width: 100%;
}

.input-wrapper {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  transition: all var(--transition-base) var(--ease-in-out);
  background: #f9f9f9;
}

.code-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.98);
}

.code-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-code-btn {
  padding: 0 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 110px;
}

.send-code-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.send-code-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.send-code-btn:active:not(.disabled) {
  transform: translateY(0);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .input-wrapper {
    gap: 8px;
  }

  .code-input {
    padding: 12px 16px;
    font-size: 14px;
  }

  .send-code-btn {
    padding: 0 16px;
    font-size: 13px;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .input-wrapper {
    gap: 6px;
  }

  .code-input {
    padding: 12px 14px;
    font-size: 13px;
  }

  .send-code-btn {
    padding: 0 12px;
    font-size: 12px;
    min-width: 90px;
  }
}

/* iPad竖屏优化 */
@media (min-width: 481px) and (max-width: 1024px) and (orientation: portrait) {
  .send-code-btn {
    min-width: 120px;
  }
}
</style>
