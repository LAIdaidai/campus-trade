<template>
  <teleport to="body">
    <transition name="dialog">
      <div v-if="visible" class="dialog-overlay" @click="handleClose">
        <div class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h3>订单详情</h3>
            <button class="close-btn" @click="handleClose">×</button>
          </div>

          <div class="dialog-body">
            <!-- 商品信息 -->
            <div class="section">
              <h4 class="section-title">商品信息</h4>
              <div class="product-info">
                <img 
                  :src="getImageUrl(order.product_image)" 
                  :alt="order.product_title"
                  class="product-image"
                />
                <div class="product-details">
                  <h5>{{ order.product_title }}</h5>
                  <p class="price">¥{{ order.price }}</p>
                </div>
              </div>
            </div>

            <!-- 收货地址 -->
            <div v-if="order.address_full || order.address_detail || order.address_name" class="section">
              <h4 class="section-title">收货地址</h4>
              <div class="address-info">
                <p v-if="order.address_name || order.address_phone"><strong>收货人：</strong>{{ order.address_name }} <span v-if="order.address_phone">{{ order.address_phone }}</span></p>
                <p v-if="order.address_full"><strong>地址：</strong>{{ order.address_full }}</p>
                <p v-else-if="order.address_detail"><strong>地址：</strong>{{ order.address_detail }}</p>
              </div>
            </div>

            <!-- 备注信息 -->
            <div v-if="order.remark" class="section">
              <h4 class="section-title">买家留言</h4>
              <p class="remark">{{ order.remark }}</p>
            </div>

            <!-- 订单状态 -->
            <div class="section">
              <h4 class="section-title">订单状态</h4>
              <span class="status-badge" :class="`status-${order.status}`">
                {{ getStatusText(order.status) }}
              </span>
            </div>

            <!-- 时间信息 -->
            <div class="section">
              <h4 class="section-title">时间信息</h4>
              <div class="time-info">
                <p><strong>创建时间：</strong>{{ formatTime(order.created_at) }}</p>
                <p v-if="order.paid_at"><strong>付款时间：</strong>{{ formatTime(order.paid_at) }}</p>
                <p v-if="order.shipped_at"><strong>发货时间：</strong>{{ formatTime(order.shipped_at) }}</p>
                <p v-if="order.completed_at"><strong>完成时间：</strong>{{ formatTime(order.completed_at) }}</p>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="handleClose">关闭</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { getImageUrl } from '@/config'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  order: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
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
  max-width: 600px;
  max-height: 85vh;
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
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-info {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-details h5 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.price {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ff2442;
}

.address-info,
.time-info {
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.address-info p,
.time-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.address-info p:last-child,
.time-info p:last-child {
  margin-bottom: 0;
}

.remark {
  margin: 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-paid {
  background: #dbeafe;
  color: #2563eb;
}

.status-shipped {
  background: #e0e7ff;
  color: #6366f1;
}

.status-completed {
  background: #d1fae5;
  color: #059669;
}

.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* 过渡动画 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform 0.3s;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.95);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dialog-content {
    max-width: 100%;
    max-height: 90vh;
  }

  .dialog-header {
    padding: 16px 20px;
  }

  .dialog-body {
    padding: 20px;
  }

  .product-image {
    width: 80px;
    height: 80px;
  }

  .product-details h5 {
    font-size: 15px;
  }

  .price {
    font-size: 18px;
  }
}
</style>

