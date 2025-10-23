<template>
  <div class="order-message" :class="[`status-${orderData.status}`, { 'is-mine': isMine }]">
    <div class="order-header">
      <span class="order-icon">📦</span>
      <span class="order-title">订单信息</span>
      <span class="order-status-badge" :class="`status-${orderData.status}`">
        {{ getStatusText(orderData.status) }}
      </span>
    </div>

    <div class="order-content">
      <!-- 商品信息 -->
      <div class="product-info">
        <img 
          :src="getImageUrl(orderData.product_image)" 
          :alt="orderData.product_title" 
          class="product-image"
        />
        <div class="product-details">
          <h4 class="product-title">{{ orderData.product_title }}</h4>
          <div class="price-info">
            <span 
              v-if="orderData.final_price !== orderData.original_price" 
              class="original-price"
            >
              ¥{{ orderData.original_price }}
            </span>
            <span class="final-price">¥{{ orderData.final_price }}</span>
          </div>
        </div>
      </div>

      <!-- 地址信息 -->
      <div v-if="orderData.address_detail" class="address-info">
        <div class="info-label">📍 收货地址</div>
        <div class="info-content">
          {{ formatAddress(orderData.address_detail) }}
        </div>
      </div>

      <!-- 备注信息 -->
      <div v-if="orderData.remark" class="remark-info">
        <div class="info-label">💬 买家留言</div>
        <div class="info-content">{{ orderData.remark }}</div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="order-actions">
      <!-- 非最新订单，显示已过期提示 -->
      <template v-if="!isLatestOrder && orderData.status !== 'confirmed' && orderData.status !== 'rejected'">
        <span class="expired-text">该订单已更新，请查看最新订单</span>
      </template>

      <!-- 卖家视图 -->
      <template v-else-if="isSeller && orderData.status === 'pending' && isLatestOrder">
        <button class="btn btn-secondary" @click="handleModifyPrice">
          修改价格
        </button>
        <button class="btn btn-primary" @click="handleConfirm">
          确认订单
        </button>
      </template>

      <!-- 买家视图 -->
      <template v-else-if="!isSeller && isLatestOrder">
        <!-- 待确认状态 -->
        <template v-if="orderData.status === 'pending' || orderData.status === 'modified'">
          <button class="btn btn-secondary" @click="handleCancel">
            取消
          </button>
          <button class="btn btn-primary" @click="handleBuyerConfirm">
            确认下单
          </button>
        </template>

        <!-- 已确认状态 -->
        <template v-else-if="orderData.status === 'confirmed' && orderData.order_id">
          <button class="btn btn-outline" @click="viewOrderDetail">
            查看订单
          </button>
        </template>
      </template>

      <!-- 已拒绝状态 -->
      <template v-if="orderData.status === 'rejected'">
        <span class="rejected-text">订单已取消</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getImageUrl } from '@/config'

const props = defineProps({
  orderData: {
    type: Object,
    required: true
  },
  isMine: {
    type: Boolean,
    default: false
  },
  isSeller: {
    type: Boolean,
    default: false
  },
  isLatestOrder: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['modify-price', 'confirm', 'cancel', 'buyer-confirm', 'view-order'])

// 状态文本映射
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待确认',
    'modified': '价格已修改',
    'confirmed': '已确认',
    'rejected': '已取消'
  }
  return statusMap[status] || status
}

// 格式化地址
const formatAddress = (address) => {
  if (typeof address === 'string') {
    return address
  }
  return `${address.province} ${address.city} ${address.district} ${address.detail} (${address.name} ${address.phone})`
}

// 事件处理
const handleModifyPrice = () => {
  emit('modify-price', props.orderData)
}

const handleConfirm = () => {
  emit('confirm', props.orderData)
}

const handleCancel = () => {
  emit('cancel', props.orderData)
}

const handleBuyerConfirm = () => {
  emit('buyer-confirm', props.orderData)
}

const viewOrderDetail = () => {
  emit('view-order', props.orderData.order_id)
}
</script>

<style scoped>
.order-message {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 400px;
}

.order-message.is-mine {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.order-message.is-mine .order-header {
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.order-icon {
  font-size: 20px;
}

.order-title {
  font-weight: 600;
  flex: 1;
}

.order-status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.order-status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.order-status-badge.status-modified {
  background: #dbeafe;
  color: #1e40af;
}

.order-status-badge.status-confirmed {
  background: #d1fae5;
  color: #065f46;
}

.order-status-badge.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.order-message.is-mine .order-status-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-info {
  display: flex;
  gap: 12px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-price {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: line-through;
}

.order-message.is-mine .original-price {
  color: rgba(255, 255, 255, 0.6);
}

.final-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff2442;
}

.order-message.is-mine .final-price {
  color: #fff;
}

.address-info,
.remark-info {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.order-message.is-mine .address-info,
.order-message.is-mine .remark-info {
  background: rgba(255, 255, 255, 0.15);
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  opacity: 0.8;
}

.info-content {
  font-size: 13px;
  line-height: 1.5;
}

.order-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.order-message.is-mine .order-actions {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  color: #fff;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #e02039 0%, #e05858 100%);
}

.order-message.is-mine .btn-primary {
  background: #fff;
  color: #ff2442;
}

.order-message.is-mine .btn-primary:hover {
  background: #f3f4f6;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
}

.btn-secondary:hover {
  background: #4b5563;
}

.order-message.is-mine .btn-secondary {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.order-message.is-mine .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.35);
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
}

.order-message.is-mine .btn-outline {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.order-message.is-mine .btn-outline:hover {
  background: rgba(255, 255, 255, 0.15);
}

.rejected-text,
.expired-text {
  flex: 1;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.expired-text {
  color: #f59e0b;
  font-style: italic;
}

.order-message.is-mine .rejected-text,
.order-message.is-mine .expired-text {
  color: rgba(255, 255, 255, 0.7);
}
</style>

