<template>
  <div class="page">
    <div class="user-homepage">
      <!-- 用户信息卡片 -->
      <div v-if="userInfo" class="user-card">
        <!-- 返回按钮 -->
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <img :src="getUserAvatar" :alt="userInfo.username" class="user-avatar" />
        <div class="user-info">
          <h1 class="username">{{ userInfo.username }}</h1>
          <p class="user-meta">
            <span>加入于 {{ formatDate(userInfo.created_at) }}</span>
          </p>
        </div>
      </div>

      <!-- 商品列表 -->
      <div class="products-section">
        <h2 class="section-title">TA的商品 ({{ products.length }})</h2>
        
        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="products.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>该用户还没有发布商品</p>
        </div>

        <!-- 商品网格 -->
        <div v-else class="products-grid">
          <div 
            v-for="product in products" 
            :key="product.id"
            class="product-item"
            @click="goToProduct(product.id)"
          >
            <div class="product-image">
              <img :src="getImageUrl(product.images[0])" :alt="product.title" />
              <!-- 已售出水印 -->
              <div v-if="product.status === 'sold'" class="sold-watermark">
                已售出
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="product-price">¥{{ product.price }}</p>
              <p class="product-time">{{ formatTime(product.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserById } from '@/api/user'
import { getProducts } from '@/api/product'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'

const route = useRoute()
const router = useRouter()

const userId = computed(() => route.params.id)
const userInfo = ref(null)
const products = ref([])
const loading = ref(false)

// 获取用户头像
const getUserAvatar = computed(() => {
  if (userInfo.value?.avatar) {
    return getImageUrl(userInfo.value.avatar)
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.value?.username || '用户')}&background=ff2442&color=fff&size=200`
})

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserById(userId.value)
    if (response.success) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    toast.error('获取用户信息失败')
  }
}

// 获取用户的商品
const fetchUserProducts = async () => {
  loading.value = true
  try {
    const params = {
      user_id: userId.value,
      status: '', // 空字符串表示获取所有状态的商品
      limit: 100,
      offset: 0
    }
    
    const response = await getProducts(params)
    
    if (response.success) {
      products.value = response.data || []
      
      // 检查已售出商品
      const soldProducts = products.value.filter(p => p.status === 'sold')
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    toast.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到商品详情
const goToProduct = (productId) => {
  router.push(`/product/${productId}`)
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  
  if (days < 1) return '今天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return formatDate(dateString)
}

onMounted(() => {
  fetchUserInfo()
  fetchUserProducts()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-light);
}

.user-homepage {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.back-btn svg {
  width: 22px;
  height: 22px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

/* 用户信息卡片 */
.user-card {
  background: linear-gradient(135deg, #f76477 0%, #f56363 100%);
  border-radius: 24px;
  padding: 56px 48px 48px;
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 40px;
  box-shadow: 0 8px 32px rgba(255, 36, 66, 0.25);
  position: relative; /* 让返回按钮相对于卡片定位 */
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.user-info {
  flex: 1;
  color: #fff;
  position: relative;
  z-index: 1;
}

.username {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-meta {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/* 商品列表 */
.products-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
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
  font-size: 72px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-item {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-item:hover .product-image img {
  transform: scale(1.05);
}

/* 已售出水印 */
.sold-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-size: 48px;
  font-weight: 900;
  font-style: italic;
  color: rgba(255, 0, 0, 0.6);
  text-shadow: 
    2px 2px 4px rgba(255, 255, 255, 0.8),
    -2px -2px 4px rgba(255, 255, 255, 0.8);
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.product-info {
  padding: 16px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 8px 0;
}

.product-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* 响应式 */

/* iPad横屏 - 4列 */
@media (min-width: 1024px) and (max-width: 1366px) and (orientation: landscape) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

/* iPad竖屏（包括iPad mini） - 3列 */
@media (min-width: 744px) and (max-width: 1024px) and (orientation: portrait) {
  .user-homepage {
    padding: 24px 20px;
  }

  .back-btn {
    top: 24px;
    left: 24px;
    width: 44px;
    height: 44px;
  }

  .back-btn svg {
    width: 22px;
    height: 22px;
  }

  .user-card {
    margin-bottom: 24px;
    padding: 56px 24px 28px;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
  }

  .username {
    font-size: 24px;
  }

  .user-meta {
    font-size: 14px;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .product-info {
    padding: 12px;
  }

  .product-title {
    font-size: 14px;
  }

  .product-price {
    font-size: 18px;
  }

  .sold-watermark {
    font-size: 36px;
  }

  .products-section {
    padding: 20px;
  }
}

/* 手机 - 2列 */
@media (max-width: 743px) {
  .user-homepage {
    padding: 16px;
  }

  .back-btn {
    top: 20px;
    left: 20px;
    width: 40px;
    height: 40px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .back-btn svg {
    width: 20px;
    height: 20px;
  }

  /* 移动端用户卡片 - 紧凑设计 */
  .user-card {
    flex-direction: row;
    align-items: center;
    text-align: left;
    padding: 52px 16px 20px;
    margin-bottom: 20px;
    border-radius: 16px;
    gap: 16px;
  }

  .user-card::before {
    display: none; /* 移动端移除装饰背景 */
  }

  .user-avatar {
    width: 64px;
    height: 64px;
    border-width: 3px;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .username {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 6px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-meta {
    font-size: 13px;
  }

  .products-section {
    padding: 16px;
    border-radius: 16px;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .sold-watermark {
    font-size: 28px;
  }
}
</style>

