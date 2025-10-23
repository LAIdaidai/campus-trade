<template>
  <div v-if="visible" class="dialog-overlay" @click="handleClose">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>发起订单</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-body">
        <!-- 商品信息 -->
        <div class="product-section">
          <img 
            :src="getImageUrl(product.image)" 
            :alt="product.title" 
            class="product-image"
          />
          <div class="product-info">
            <h4 class="product-title">{{ product.title }}</h4>
            <p class="product-price">¥{{ product.price }}</p>
          </div>
        </div>

        <!-- 地址选择 -->
        <div class="form-section">
          <div class="form-label-row">
            <label class="form-label">收货地址 *</label>
            <button 
              type="button" 
              class="btn-add-address" 
              @click="goToAddressManagement"
            >
              + 新增地址
            </button>
          </div>
          <select 
            v-model="selectedAddressId" 
            class="form-select"
            @change="handleAddressChange"
          >
            <option :value="null">请选择收货地址</option>
            <option 
              v-for="addr in addresses" 
              :key="addr.id" 
              :value="addr.id"
            >
              {{ formatAddressShort(addr) }}
            </option>
          </select>

          <!-- 显示选中地址的完整信息 -->
          <div v-if="selectedAddress" class="selected-address-detail">
            <div class="address-detail-row">
              <span class="label">收货人：</span>
              <span class="value">{{ selectedAddress.name }} {{ selectedAddress.phone }}</span>
            </div>
            <div class="address-detail-row">
              <span class="label">地址：</span>
              <span class="value">{{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.detail }}</span>
            </div>
          </div>

          <div v-if="addresses.length === 0" class="empty-address">
            <p>还没有收货地址</p>
            <button class="btn-link" @click="goToAddressManagement">
              立即添加
            </button>
          </div>
        </div>

        <!-- 买家留言 -->
        <div class="form-section">
          <label class="form-label">买家留言</label>
          <textarea 
            v-model="remark"
            class="form-textarea"
            placeholder="选填,可以说明购买意向或其他要求"
            rows="3"
            maxlength="200"
          ></textarea>
          <div class="char-count">{{ remark.length }}/200</div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button 
          class="btn btn-primary" 
          @click="handleSubmit"
          :disabled="!selectedAddressId || submitting"
        >
          {{ submitting ? '发送中...' : '发送订单' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getImageUrl } from '@/config'
import { getMyAddresses } from '@/api/address'
import toast from '@/utils/toast'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const addresses = ref([])
const selectedAddressId = ref(null)
const selectedAddress = ref(null)
const remark = ref('')
const submitting = ref(false)

// 获取地址列表
const fetchAddresses = async () => {
  try {
    const response = await getMyAddresses()
    if (response.success) {
      addresses.value = response.data
      
      // 默认选择默认地址
      const defaultAddr = addresses.value.find(addr => addr.is_default)
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.id
        selectedAddress.value = defaultAddr
      }
    }
  } catch (error) {
    console.error('获取地址列表失败:', error)
  }
}

// 格式化地址显示（完整）
const formatAddress = (addr) => {
  return `${addr.province} ${addr.city} ${addr.district} ${addr.detail} (${addr.name} ${addr.phone})`
}

// 格式化地址显示（简短，用于下拉框）
const formatAddressShort = (addr) => {
  return `${addr.name} - ${addr.province}${addr.city}${addr.district}`
}

// 地址变更
const handleAddressChange = () => {
  selectedAddress.value = addresses.value.find(addr => addr.id === selectedAddressId.value)
}

// 跳转到地址管理
const goToAddressManagement = () => {
  handleClose()
  router.push('/profile?tab=addresses')
}

// 提交订单
const handleSubmit = () => {
  if (!selectedAddressId.value) {
    toast.warning('请选择收货地址')
    return
  }

  submitting.value = true

  emit('submit', {
    address_id: selectedAddressId.value,
    address_detail: selectedAddress.value,
    remark: remark.value
  })

  // 重置状态会在父组件关闭对话框时自动执行
}

// 关闭对话框
const handleClose = () => {
  emit('close')
  // 重置表单
  setTimeout(() => {
    selectedAddressId.value = null
    selectedAddress.value = null
    remark.value = ''
    submitting.value = false
  }, 300)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchAddresses()
  }
})

onMounted(() => {
  if (props.visible) {
    fetchAddresses()
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
  max-width: 560px;
  max-height: 75vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: thin;
}

.dialog-body::-webkit-scrollbar {
  width: 6px;
}

.dialog-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dialog-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.product-section {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 24px;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.product-price {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ff2442;
}

.form-section {
  margin-bottom: 20px;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.btn-add-address {
  background: none;
  border: 1px solid #ff2442;
  color: #ff2442;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-address:hover {
  background: #ff2442;
  color: white;
}

.form-select,
.form-textarea {
  width: 100%;
  max-width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-select {
  height: auto;
  max-height: 160px;
  overflow-y: auto;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  scrollbar-width: thin;
}

.form-select::-webkit-scrollbar {
  width: 6px;
}

.form-select::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.form-select::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.form-select::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.form-select option {
  padding: 8px 12px;
  line-height: 1.5;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #ff2442;
}

/* 选中地址详情 */
.selected-address-detail {
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.address-detail-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.address-detail-row:last-child {
  margin-bottom: 0;
}

.address-detail-row .label {
  color: #6b7280;
  min-width: 70px;
  flex-shrink: 0;
}

.address-detail-row .value {
  color: #374151;
  flex: 1;
  word-break: break-word;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.empty-address {
  text-align: center;
  padding: 16px;
  background: #fef3c7;
  border-radius: 8px;
  margin-top: 8px;
}

.empty-address p {
  margin: 0 0 8px 0;
  color: #92400e;
}

.btn-link {
  background: none;
  border: none;
  color: #ff2442;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #e02039;
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
    max-height: 100vh;
    border-radius: 0;
  }
  
  .product-section {
    flex-direction: column;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
  }

  .form-select {
    font-size: 16px; /* 防止iOS自动缩放 */
  }
}

/* iPad 优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .dialog-content {
    max-width: 500px;
  }
}
</style>

