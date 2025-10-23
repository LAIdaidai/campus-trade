<template>
  <div class="page">
    <main class="main-content">
      <div class="favorites-container">
        <h1 class="page-title">我的收藏</h1>
        
        <!-- 加载中 -->
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading && favorites.length === 0" class="empty-state">
          <div class="empty-icon">❤️</div>
          <h3>还没有收藏</h3>
          <p>去首页逛逛,收藏喜欢的商品吧~</p>
          <button class="btn-browse" @click="$router.push('/')">去逛逛</button>
        </div>

        <!-- 收藏列表 - 网格布局 -->
        <div v-else-if="!loading && favorites.length > 0" class="favorites-grid">
          <XHSProductCard 
            v-for="item in favorites"
            :key="item.id"
            :product="item" 
            :show-delete-icon="true"
            :force-show-delete="true"
            @delete="handleDeleteFavorite"
          />
        </div>
      </div>
    </main>
    
    <!-- 撤回提示 -->
    <UndoToast 
      ref="undoToastRef" 
      :message="undoMessage"
      @undo="handleUndo"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFavorites, removeFavorite, addFavorite } from '@/api/favorite'
import { getImageUrl } from '@/config'
import XHSProductCard from '@/components/XHSProductCard.vue'
import UndoToast from '@/components/UndoToast.vue'
import toast from '@/utils/toast'

defineOptions({
  name: 'Favorites'
})

const router = useRouter()
const loading = ref(true)
const favorites = ref([])
const undoToastRef = ref(null)
const undoMessage = ref('')
const deletedItem = ref(null)

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

// 获取收藏列表
const fetchFavorites = async () => {
  try {
    loading.value = true
    const response = await getUserFavorites()
    
    
    
    // 后端返回的是 { success: true, data: [...] }
    const favoritesList = response.data || response.favorites || []
    
    favorites.value = favoritesList.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.images && item.images.length > 0 
        ? getImageUrl(item.images[0])
        : 'https://picsum.photos/400/400?random=' + item.id,
      location: '校园',
      views: 0,
      favoriteCount: item.favorite_count ?? item.favoriteCount ?? 0, // 收藏人数
      sellerAvatar: item.seller_avatar 
        ? getImageUrl(item.seller_avatar)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller_name || '用户')}&background=ff2442&color=fff&size=80`,
      sellerName: item.seller_name || '匿名用户',
      publishTime: formatTime(item.created_at),
      status: item.status
    }))
    
    
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    toast.error('获取收藏列表失败: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

// 跳转到商品详情
const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

// 删除收藏
const handleDeleteFavorite = async (productId) => {
  try {
    // 找到要删除的项
    const itemToDelete = favorites.value.find(item => item.id === productId)
    if (!itemToDelete) return
    
    // 保存删除的项
    deletedItem.value = itemToDelete
    
    // 先从UI中移除
    favorites.value = favorites.value.filter(item => item.id !== productId)
    
    // 调用API删除
    await removeFavorite(productId)
    
    // 显示撤回提示
    undoMessage.value = '已取消收藏'
    undoToastRef.value?.show()
    
    // 4秒后清除deletedItem（过期后不能撤回）
    setTimeout(() => {
      if (deletedItem.value?.id === productId) {
        deletedItem.value = null
      }
    }, 4000)
  } catch (error) {
    console.error('取消收藏失败:', error)
    // 如果删除失败，恢复UI
    if (deletedItem.value) {
      favorites.value.push(deletedItem.value)
      favorites.value.sort((a, b) => b.id - a.id)
      deletedItem.value = null
    }
    toast.error('取消收藏失败: ' + (error.response?.data?.error || error.message))
  }
}

// 撤回删除
const handleUndo = async () => {
  if (!deletedItem.value) return
  
  try {
    // 恢复到列表
    favorites.value.push(deletedItem.value)
    favorites.value.sort((a, b) => b.id - a.id)
    
    // 调用API重新收藏
    await addFavorite(deletedItem.value.id)
    
    deletedItem.value = null
  } catch (error) {
    console.error('撤回失败:', error)
    // 如果撤回失败，再次从列表移除
    favorites.value = favorites.value.filter(item => item.id !== deletedItem.value?.id)
    deletedItem.value = null
    toast.error('撤回失败')
  }
}

// 简单的消息提示函数
const showMessage = (message, type = 'info') => {
  const messageEl = document.createElement('div')
  messageEl.className = `custom-message custom-message-${type}`
  messageEl.textContent = message
  document.body.appendChild(messageEl)
  
  setTimeout(() => {
    messageEl.classList.add('show')
  }, 10)
  
  setTimeout(() => {
    messageEl.classList.remove('show')
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 300)
  }, 2000)
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-gray);
}

.main-content {
  max-width: 100%;
  margin: 0 20px; /* 左右边距都是20px，和消息页一致 */
  padding: 32px 20px;
}

.favorites-container {
  width: 100%;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 32px 0;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 80px 20px;
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

/* 收藏为空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.empty-state p {
  font-size: 16px;
  color: var(--text-tertiary);
  margin: 0 0 32px 0;
}

.btn-browse {
  padding: 12px 40px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.3);
}

.btn-browse:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 36, 66, 0.45);
}

/* 收藏网格布局 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

/* 响应式网格 */
@media (min-width: 1536px) {
  .favorites-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: 1280px) and (max-width: 1535px) {
  .favorites-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .favorites-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .favorites-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .page-title {
    font-size: 28px;
  }
}

/* iPad横屏：统一边距 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .main-content {
    margin: 0 20px; /* 统一为20px，和其他页面一致 */
    padding: 32px 20px;
  }
}

/* iPad竖屏：统一边距 */
@media (max-width: 1024px) and (orientation: portrait) {
  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 20px 16px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 12px;
  }
  
  .favorites-container {
    padding: 0;
  }
  
  .page-title {
    font-size: 24px;
    margin-bottom: 20px;
    padding: 0 4px;
  }

  .favorites-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .empty-state {
    padding: 60px 20px;
    border-radius: 16px;
  }

  .empty-icon {
    font-size: 64px;
  }

  .empty-state h3 {
    font-size: 20px;
  }

  .empty-state p {
    font-size: 14px;
  }

  .btn-browse {
    padding: 10px 32px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
    margin-bottom: 16px;
  }

  .favorites-grid {
    gap: 8px;
  }

  .empty-state {
    padding: 40px 16px;
  }

  .empty-icon {
    font-size: 56px;
  }

  .empty-state h3 {
    font-size: 18px;
  }

  .btn-browse {
    padding: 8px 28px;
    font-size: 14px;
  }
}
</style>

<style>
/* 全局消息提示样式 */
.custom-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-message.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.custom-message-success {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.custom-message-error {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
}

.custom-message-info {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
}
</style>
