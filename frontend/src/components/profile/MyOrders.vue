<template>
  <div class="my-orders">
    <div class="tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'bought' }]"
        @click="activeTab = 'bought'"
      >
        我买到的
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'sold' }]"
        @click="activeTab = 'sold'"
      >
        我卖出的
      </button>
    </div>

    <div class="orders-list">
      <div v-if="loading" class="loading">加载中...</div>
      
      <div v-else-if="displayOrders.length === 0" class="empty">
        <p>{{ activeTab === 'bought' ? '还没有购买记录' : '还没有卖出记录' }}</p>
      </div>

      <div 
        v-else 
        v-for="order in displayOrders" 
        :key="order.id"
        class="order-card"
        @click="viewOrderDetail(order)"
      >
        <img 
          :src="getImageUrl(order.product_image)" 
          :alt="order.product_title"
          class="order-image"
        />
        <div class="order-info">
          <h4 class="order-title">{{ order.product_title }}</h4>
          <div class="order-meta">
            <span class="order-price">¥{{ order.price }}</span>
            <span class="order-status" :class="`status-${order.status}`">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          <div class="order-time">{{ formatTime(order.created_at) }}</div>
        </div>
        <div class="order-arrow">›</div>
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <OrderDetailDialog
      v-if="selectedOrder"
      :visible="showDetailDialog"
      :order="selectedOrder"
      @close="showDetailDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyOrders, getOrderById } from '@/api/order'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'
import OrderDetailDialog from '@/components/OrderDetailDialog.vue'

const props = defineProps({
  defaultTab: {
    type: String,
    default: 'bought' // bought | sold
  }
})

const activeTab = ref(props.defaultTab === 'sold' ? 'sold' : 'bought')
const orders = ref([])
const loading = ref(false)
const showDetailDialog = ref(false)
const selectedOrder = ref(null)

const displayOrders = computed(() => {
  if (activeTab.value === 'bought') {
    return orders.value.filter(o => o.is_buyer)
  } else {
    return orders.value.filter(o => !o.is_buyer)
  }
})

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
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getMyOrders()
    orders.value = res.data || []
  } catch (error) {
    console.error('加载订单失败:', error)
    toast.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const viewOrderDetail = async (order) => {
  try {
    const res = await getOrderById(order.id)
    if (res && res.success !== false) {
      selectedOrder.value = res.data || res
      showDetailDialog.value = true
    } else {
      throw new Error(res?.message || '获取订单失败')
    }
  } catch (e) {
    console.error('获取订单详情失败:', e)
    toast.error('获取订单详情失败')
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.my-orders {
  width: 100%;
}

.tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.tab-btn.active {
  color: #ff2442;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff2442;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.order-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s;
}

.order-card:hover {
  border-color: #ff2442;
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.1);
  transform: translateY(-2px);
}

.order-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.order-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff2442;
}

.order-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
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

.order-time {
  font-size: 13px;
  color: #9ca3af;
}

.order-arrow {
  font-size: 24px;
  color: #d1d5db;
  flex-shrink: 0;
}

/* iPad 适配 */
@media (max-width: 1024px) {
  .order-image {
    width: 70px;
    height: 70px;
  }

  .order-title {
    font-size: 15px;
  }

  .order-price {
    font-size: 16px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 10px 16px;
    font-size: 15px;
  }

  .order-card {
    padding: 12px;
    gap: 12px;
  }

  .order-image {
    width: 60px;
    height: 60px;
  }

  .order-title {
    font-size: 14px;
  }

  .order-price {
    font-size: 15px;
  }

  .order-status {
    font-size: 11px;
    padding: 3px 10px;
  }

  .order-time {
    font-size: 12px;
  }
}
</style>

