<template>
  <div class="view-history">
    <!-- 顶部操作栏 -->
    <div class="history-header">
      <p class="history-count">共 {{ products.length }} 条浏览记录</p>
      <button 
        v-if="products.length > 0"
        class="btn-clear"
        @click="confirmClear"
      >
        清空历史
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon icon-eye-large"></div>
      <p>还没有浏览记录</p>
      <button class="btn-browse" @click="$router.push('/')">
        去首页逛逛
      </button>
    </div>

    <!-- 历史列表 -->
    <div v-else class="history-grid">
      <div 
        v-for="item in products" 
        :key="item.id"
        class="history-item"
      >
        <div class="item-image" @click="goToDetail(item.product_id)">
          <img :src="getImageUrl(item.images[0])" :alt="item.title" />
          <div v-if="item.status === 'sold'" class="sold-badge">已售出</div>
        </div>
        <div class="item-info">
          <h4 class="item-title" @click="goToDetail(item.product_id)">
            {{ item.title }}
          </h4>
          <p class="item-price">¥{{ item.price }}</p>
          <p class="item-time">浏览于 {{ formatTime(item.view_time) }}</p>
        </div>
        <button 
          class="btn-delete"
          @click="deleteItem(item.id)"
          title="删除"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-load-more" @click="loadMore">
        加载更多
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getViewHistory, clearViewHistory, deleteViewHistory } from '@/api/viewHistory'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'
import { showDeleteConfirm } from '@/utils/dialog'

const router = useRouter()

const loading = ref(false)
const products = ref([])
const hasMore = ref(false)
const offset = ref(0)
const limit = 20

// 获取浏览历史
const fetchHistory = async (reset = true) => {
  try {
    loading.value = true
    if (reset) {
      offset.value = 0
    }

    const params = {
      limit,
      offset: offset.value
    }

    const response = await getViewHistory(params)
    
    if (reset) {
      products.value = response.data || []
    } else {
      products.value = [...products.value, ...(response.data || [])]
    }

    hasMore.value = response.pagination?.hasMore || false
    offset.value += limit
  } catch (error) {
    console.error('获取浏览历史失败:', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  fetchHistory(false)
}

// 清空历史
const confirmClear = async () => {
  const confirmed = await showDeleteConfirm('确定要清空所有浏览历史吗？此操作无法撤销！')
  
  if (!confirmed) return

  try {
    await clearViewHistory()
    products.value = []
    toast.success('已清空浏览历史')
  } catch (error) {
    console.error('清空失败:', error)
    toast.error('操作失败,请稍后重试')
  }
}

// 删除单条记录
const deleteItem = async (historyId) => {
  try {
    await deleteViewHistory(historyId)
    products.value = products.value.filter(item => item.id !== historyId)
    toast.success('已删除')
  } catch (error) {
    console.error('删除失败:', error)
    toast.error('删除失败,请稍后重试')
  }
}

// 跳转到详情页
const goToDetail = (productId) => {
  router.push(`/product/${productId}`)
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString()
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.view-history {
  width: 100%;
}

/* 顶部操作栏 */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.history-count {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.btn-clear {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid var(--primary-color);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-clear:hover {
  background: var(--primary-color);
  color: #fff;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  opacity: 0.3;
  position: relative;
}

.icon-eye-large::before {
  content: '';
  position: absolute;
  width: 60px;
  height: 30px;
  border: 4px solid #999;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-eye-large::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: #999;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.btn-browse {
  padding: 12px 32px;
  border-radius: var(--radius-xl);
  border: none;
  background: var(--primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-browse:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

/* 历史网格 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.history-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.item-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base) var(--ease-in-out);
}

.item-image:hover img {
  transform: scale(1.05);
}

.sold-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.item-info {
  padding: 16px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title:hover {
  color: var(--primary-color);
}

.item-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.item-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

.btn-delete {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: var(--primary-color);
  transform: scale(1.1);
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-top: 32px;
}

.btn-load-more {
  padding: 12px 40px;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-load-more:hover {
  background: var(--primary-color);
  color: #fff;
}

/* iPad mini - iPad Pro：统一3列网格 */
@media (min-width: 769px) and (max-width: 1366px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .item-info {
    padding: 12px;
  }

  .item-title {
    font-size: 14px;
  }

  .item-price {
    font-size: 18px;
  }

  .item-time {
    font-size: 12px;
  }
}

/* 移动端：3列网格 */
@media (max-width: 768px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  /* 缩小商品信息字体 */
  .item-info {
    padding: 8px;
  }

  .item-title {
    font-size: 12px;
    margin: 0 0 4px 0;
  }

  .item-price {
    font-size: 14px;
    margin: 0 0 4px 0;
  }

  .item-time {
    font-size: 10px;
  }

  .btn-delete {
    width: 24px;
    height: 24px;
    top: 6px;
    right: 6px;
    font-size: 18px;
  }
}
</style>
