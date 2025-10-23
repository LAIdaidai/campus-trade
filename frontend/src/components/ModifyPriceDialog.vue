<template>
  <div v-if="visible" class="dialog-overlay" @click="handleClose">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>修改订单价格</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <!-- 原价 -->
        <div class="price-item">
          <label class="price-label">商品原价</label>
          <div class="price-value original">¥{{ orderData?.original_price || 0 }}</div>
        </div>

        <!-- 新价格 -->
        <div class="form-section">
          <label class="form-label">修改后价格 *</label>
          <div class="price-input-wrapper">
            <span class="price-symbol">¥</span>
            <input 
              type="number"
              v-model="newPrice"
              class="price-input"
              placeholder="请输入新价格"
              min="0"
              step="0.01"
            />
          </div>
          <p class="price-hint">请输入合理的价格</p>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="!isValidPrice || submitting"
        >
          {{ submitting ? '发送中...' : '确认修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  orderData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'submit'])

const newPrice = ref('')
const submitting = ref(false)

// 验证价格
const isValidPrice = computed(() => {
  const price = parseFloat(newPrice.value)
  return !isNaN(price) && price > 0
})

// 提交
const handleSubmit = () => {
  if (!isValidPrice.value) {
    return
  }

  submitting.value = true
  
  emit('submit', {
    new_price: parseFloat(newPrice.value)
  })

  // 重置会在关闭时处理
}

// 关闭
const handleClose = () => {
  emit('close')
  setTimeout(() => {
    newPrice.value = ''
    submitting.value = false
  }, 300)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal && props.orderData) {
    // 默认使用当前价格
    newPrice.value = props.orderData.final_price || props.orderData.original_price || ''
  }
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.dialog-content {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.3s;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #374151;
}

.dialog-body {
  padding: 24px;
}

.price-item {
  margin-bottom: 24px;
}

.price-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #6b7280;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
}

.price-value.original {
  color: #9ca3af;
}

.form-section {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.price-symbol {
  position: absolute;
  left: 16px;
  font-size: 20px;
  font-weight: 600;
  color: #ff2442;
}

.price-input {
  width: 100%;
  padding: 16px 16px 16px 40px;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
  transition: border-color 0.3s;
}

.price-input:focus {
  outline: none;
  border-color: #ff2442;
}

.price-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e02039 0%, #e05858 100%);
}

@media (max-width: 768px) {
  .dialog-content {
    max-width: 100%;
  }
}
</style>

