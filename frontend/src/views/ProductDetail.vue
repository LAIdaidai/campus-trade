<template>
  <div class="page">
    <main class="main-content">
      <!-- 返回按钮 -->
      <div class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        返回
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="error-box">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="goBack" class="btn-back">返回首页</button>
      </div>

      <!-- 商品详情 -->
      <div v-else-if="product" class="detail-container">
        <!-- 已售出水印 -->
        <div v-if="product.status === 'sold'" class="sold-watermark">
          已售出
        </div>

        <div class="product-layout">
          <!-- 左侧:图片轮播 -->
          <div class="product-gallery">
            <div class="main-image" @click="openImagePreview">
              <img :src="currentImage" :alt="product.title" />
              
              <!-- 预览图标提示 -->
              <div class="preview-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>点击预览</span>
              </div>
              
              <!-- 图片导航 -->
              <div class="image-nav">
                <button 
                  v-if="product.images.length > 1" 
                  class="nav-btn prev" 
                  @click="prevImage"
                  :disabled="currentImageIndex === 0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button 
                  v-if="product.images.length > 1" 
                  class="nav-btn next" 
                  @click="nextImage"
                  :disabled="currentImageIndex === product.images.length - 1"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              <!-- 悬停操作按钮 -->
              <div v-if="!isOwnProduct" class="card-actions">
                <button 
                  class="action-btn favorite-btn" 
                  :class="{ active: isFavorited }"
                  @click.stop="toggleFavorite"
                  title="收藏"
                >
                  <svg v-if="!isFavorited" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button 
                  class="action-btn contact-btn"
                  @click.stop="contactSeller"
                  :disabled="product.status === 'sold'"
                  :title="product.status === 'sold' ? '已售出' : '我想要'"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 缩略图列表 -->
            <div v-if="product.images && product.images.length > 1" class="thumbnails">
              <div 
                v-for="(image, index) in product.images" 
                :key="index"
                :class="['thumbnail', { active: currentImageIndex === index }]"
                @click="currentImageIndex = index"
                :title="`查看图片 ${index + 1}`"
              >
                <img 
                  :src="getImageUrl(image)" 
                  :alt="`${product.title} - 图${index + 1}`"
                  @error="(e) => e.target.src = 'https://via.placeholder.com/80x80?text=Image'"
                />
              </div>
            </div>

            <!-- 商品详细信息 -->
            <div class="detail-list">
              <div class="detail-item">
                <span class="label">分类</span>
                <span class="value">{{ getCategoryText(product.category) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">成色</span>
                <span class="value">{{ getConditionText(product.condition) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">状态</span>
                <span :class="['value', `status-${product.status}`]">
                  {{ getStatusText(product.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 右侧:商品信息 -->
          <div class="product-info">
            <h1 class="product-title">{{ product.title }}</h1>
            
            <div class="price-section">
              <span class="price">¥{{ product.price }}</span>
              <span class="condition-tag">{{ getConditionText(product.condition) }}</span>
            </div>

            <div class="meta-info">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{{ favoriteCount }} 人收藏</span>
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{{ formatDate(product.created_at) }}</span>
              </div>
            </div>

            <!-- 卖家操作按钮 -->
            <div v-if="isOwnProduct && product.status === 'available'" class="seller-actions">
              <button class="btn-mark-sold" @click="markAsSold">
                标记为已售出
              </button>
            </div>

            <!-- 商品描述 -->
            <div class="description-section">
              <h3>商品介绍</h3>
              <div 
                class="description-text" 
                :class="{ collapsed: isDescriptionCollapsed && product.description.length > 150 }"
                v-html="formattedDescription"
              ></div>
              <button 
                v-if="product.description.length > 150" 
                class="btn-toggle-description"
                @click="isDescriptionCollapsed = !isDescriptionCollapsed"
              >
                {{ isDescriptionCollapsed ? '展开全部' : '收起' }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline :points="isDescriptionCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15'"></polyline>
                </svg>
              </button>
            </div>

             <!-- 卖家信息 -->
             <div class="seller-section">
               <h3>卖家信息</h3>
               <div class="seller-card clickable" @click="goToUserPage">
                 <img :src="sellerAvatar" :alt="product.seller_name" class="seller-avatar" />
                 <div class="seller-details">
                   <div class="seller-name">
                     {{ product.seller_name || '匿名用户' }}
                   </div>
                   <div class="seller-meta">发布于 {{ formatDate(product.created_at) }}</div>
                 </div>
                 <svg class="goto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M9 18l6-6-6-6"/>
                 </svg>
               </div>
             </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 图片预览模态框 -->
    <Teleport to="body">
      <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
        <div class="preview-header">
          <span class="preview-counter">{{ previewImageIndex + 1 }} / {{ product.images.length }}</span>
          <button class="btn-close" @click="closeImagePreview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="preview-content" @click.stop>
          <img :src="getImageUrl(product.images[previewImageIndex])" :alt="product.title" />
          
          <!-- 预览导航按钮 -->
          <button 
            v-if="product.images.length > 1" 
            class="preview-nav-btn prev"
            @click.stop="prevPreviewImage"
            :disabled="previewImageIndex === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button 
            v-if="product.images.length > 1" 
            class="preview-nav-btn next"
            @click.stop="nextPreviewImage"
            :disabled="previewImageIndex === product.images.length - 1"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        
        <!-- 缩略图导航 -->
        <div v-if="product.images.length > 1" class="preview-thumbnails">
          <div 
            v-for="(image, index) in product.images" 
            :key="index"
            :class="['preview-thumb', { active: previewImageIndex === index }]"
            @click.stop="previewImageIndex = index"
          >
            <img :src="getImageUrl(image)" :alt="`图片 ${index + 1}`" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getProductById, updateProductStatus } from '@/api/product'
import { addFavorite, removeFavorite, checkFavorite, getFavoriteCount } from '@/api/favorite'
import { getOrCreateConversation } from '@/api/message'
import { addViewHistory } from '@/api/viewHistory'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'
import { showConfirm } from '@/utils/dialog'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const productId = route.params.id
const product = ref(null)
const loading = ref(true)
const error = ref('')

const currentImageIndex = ref(0)
const isFavorited = ref(false)
const favoriteCount = ref(0)
const isDescriptionCollapsed = ref(true)

// 图片预览相关
const showImagePreview = ref(false)
const previewImageIndex = ref(0)

// 打开图片预览
const openImagePreview = () => {
  previewImageIndex.value = currentImageIndex.value
  showImagePreview.value = true
  document.body.style.overflow = 'hidden' // 禁止背景滚动
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  document.body.style.overflow = '' // 恢复滚动
}

// 预览上一张
const prevPreviewImage = () => {
  if (previewImageIndex.value > 0) {
    previewImageIndex.value--
  }
}

// 预览下一张
const nextPreviewImage = () => {
  if (previewImageIndex.value < product.value.images.length - 1) {
    previewImageIndex.value++
  }
}

// 格式化描述 - 支持简单的 Markdown
const formattedDescription = computed(() => {
  if (!product.value) return ''
  let text = product.value.description
  
  // 转义 HTML 标签
  text = text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
  
  // Markdown 格式化
  // 标题
  text = text.replace(/^### (.*$)/gim, '<h4>$1</h4>')
  text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>')
  text = text.replace(/^# (.*$)/gim, '<h2>$1</h2>')
  
  // 粗体
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 斜体
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 换行
  text = text.replace(/\n/g, '<br>')
  
  // 列表
  text = text.replace(/^\- (.*$)/gim, '<li>$1</li>')
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  return text
})

// 当前显示的图片
const currentImage = computed(() => {
  if (!product.value || !product.value.images.length) return ''
  return getImageUrl(product.value.images[currentImageIndex.value])
})

// 是否是自己的商品
const isOwnProduct = computed(() => {
  return userStore.isLoggedIn && product.value && product.value.seller_id === userStore.userInfo?.id
})

// 卖家头像 (添加默认头像)
const sellerAvatar = computed(() => {
  if (!product.value) return ''
  if (product.value.seller_avatar) {
    return getImageUrl(product.value.seller_avatar)
  }
  // 使用默认头像服务
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.value.seller_name || '用户')}&background=ff2442&color=fff&size=80`
})

// 获取商品详情
const fetchProduct = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response = await getProductById(productId)
    product.value = response.data
    
    // 获取收藏状态
    if (userStore.isLoggedIn) {
      const favoriteResponse = await checkFavorite(productId)
      isFavorited.value = favoriteResponse.isFavorited
    }
    
    // 获取收藏数
    const countResponse = await getFavoriteCount(productId)
    favoriteCount.value = countResponse.count
    
    // 添加浏览历史 (仅登录用户且不是自己的商品)
    if (userStore.isLoggedIn && product.value.seller_id !== userStore.userInfo?.id) {
      try {
        await addViewHistory(productId)
      } catch (historyError) {
        // 浏览历史失败不影响页面显示
        console.warn('记录浏览历史失败:', historyError)
      }
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    error.value = err.response?.data?.error || '商品不存在或已被删除'
  } finally {
    loading.value = false
  }
}

// 切换收藏
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth')
    return
  }

  try {
    if (isFavorited.value) {
      await removeFavorite(productId)
      isFavorited.value = false
      favoriteCount.value--
    } else {
      await addFavorite(productId)
      isFavorited.value = true
      favoriteCount.value++
    }
  } catch (err) {
    console.error('收藏操作失败:', err)
    toast.error(err.response?.data?.error || '操作失败,请稍后重试')
  }
}

// 联系卖家
const contactSeller = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/auth')
    return
  }

  try {
    // 创建或获取会话
    const res = await getOrCreateConversation(productId, product.value.seller_id)
    // request.js 已经返回了 response.data,所以直接访问 conversation
    const conversationId = res.conversation.id

    // 跳转到聊天页面
    router.push({
      name: 'Messages',
      query: { 
        conversationId: conversationId
      }
    })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    toast.error('无法联系卖家,请稍后再试')
  }
}

// 标记为已售出
const markAsSold = async () => {
  const confirmed = await showConfirm({
    title: '标记为已售出',
    message: '确定要将商品标记为已售出吗？',
    type: 'warning',
    confirmText: '标记',
    cancelText: '取消'
  })
  
  if (!confirmed) {
    return
  }

  try {
    await updateProductStatus(productId, 'sold')
    product.value.status = 'sold'
    toast.success('商品已标记为已售出')
  } catch (err) {
    console.error('更新状态失败:', err)
    toast.error(err.response?.data?.error || '操作失败,请稍后重试')
  }
}

// 图片导航
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const nextImage = () => {
  if (currentImageIndex.value < product.value.images.length - 1) {
    currentImageIndex.value++
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 跳转到用户主页
const goToUserPage = () => {
  if (product.value?.seller_id) {
    router.push(`/user/${product.value.seller_id}`)
  } else {
    toast.error('无法获取卖家信息')
  }
}

// 辅助函数
const getCategoryText = (category) => {
  const categoryMap = {
    'electronics': '电子产品',
    'books': '图书教材',
    'clothes': '服装鞋帽',
    'daily': '生活用品',
    'sports': '运动器材',
    'beauty': '美妆护肤',
    'digital': '数码配件',
    'stationery': '文具用品',
    'food': '食品饮料',
    'other': '其他'
  }
  return categoryMap[category] || category
}

const getConditionText = (condition) => {
  const conditionMap = {
    'new': '全新',
    'like-new': '几乎全新',
    'good': '轻微使用痕迹',
    'fair': '明显使用痕迹',
    'poor': '重度使用'
  }
  return conditionMap[condition] || condition
}

const getStatusText = (status) => {
  const statusMap = {
    'available': '在售',
    'sold': '已售出',
    'reserved': '已预订'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-light);
}

.main-content {
  max-width: 100%;
  padding: 32px 20px;
  margin: 0 20px; /* 左右边距都是20px，和消息页一致 */
  min-height: 100vh;
}

/* 返回按钮 */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all var(--transition-base) var(--ease-in-out);
  border: none;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.back-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateX(-4px);
}

/* 加载和错误状态 */
.loading,
.error-box {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
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

.error-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.btn-back {
  margin-top: 20px;
  padding: 10px 24px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-back:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* 商品详情容器 */
.detail-container {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 已售出水印 */
.sold-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 120px;
  font-weight: 900;
  color: rgba(255, 0, 0, 0.15);
  z-index: 10;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

/* 商品布局 - 桌面端横向布局 */
.product-layout {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 32px;
  padding: 40px 20px 40px 0; /* 左侧padding为0,贴近边缘 */
  max-width: 100%;
  margin: 0;
}
@media (max-width: 1200px) {
  .product-layout {
    grid-template-columns: 380px 1fr;
    padding: 32px 16px;
  }
}
@media (max-width: 900px) {
  .product-layout {
    grid-template-columns: 1fr;
    padding: 24px 12px;
  }
} 
/* 图片画廊 */
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 420px; /* 限制最大宽度 */
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 24px;
}

.main-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.main-image:hover {
  transform: scale(1.02);
}

.main-image > img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为contain以显示完整图片 */
  border-radius: var(--radius-md);
}

/* 预览提示 */
.preview-hint {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 5;
}

.preview-hint svg {
  width: 16px;
  height: 16px;
}

.main-image:hover .preview-hint {
  opacity: 1;
  transform: translateY(0);
}

/* 悬停操作按钮容器 */
.card-actions {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.main-image:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 操作按钮 */
.action-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.action-btn svg {
  width: 22px;
  height: 22px;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}

.favorite-btn:hover svg {
  color: #ff4757;
}

.favorite-btn.active {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  box-shadow: 0 6px 24px rgba(255, 36, 66, 0.5);
}

.favorite-btn.active svg {
  color: #fff;
  animation: heartbeat 0.5s ease;
}

.contact-btn {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
}

.contact-btn svg {
  color: #fff;
}

.contact-btn:hover {
  box-shadow: 0 8px 28px rgba(255, 36, 66, 0.6);
}

.contact-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.contact-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
}

/* 图片导航 */
.image-nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  pointer-events: none;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all var(--transition-base) var(--ease-in-out);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-white);
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 缩略图列表 */
.thumbnails {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 8px 4px;
  width: 100%;
  min-height: 96px;
}

.thumbnails::-webkit-scrollbar {
  height: 8px;
}

.thumbnails::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
  margin: 0 4px;
}

.thumbnails::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}

.thumbnails::-webkit-scrollbar-thumb:hover {
  background: #e51e3a;
}

.thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-base) var(--ease-in-out);
  background: #f5f5f5;
}

.thumbnail.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 36, 66, 0.2);
}

.thumbnail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 商品信息 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

/* 价格区域 */
.price-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.price {
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-color);
}

.condition-tag {
  padding: 6px 12px;
  background: var(--bg-light);
  border-radius: var(--radius-lg);
  font-size: 14px;
  color: #69ee26;
}

/* 元信息 */
.meta-info {
  color: var(--text-secondary);
  display: flex;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.meta-item svg {
  width: 16px;
  height: 16px;
}

/* 卖家操作按钮 */
.seller-actions {
  margin-top: 16px;
}

.btn-mark-sold {
  width: 100%;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: var(--bg-dark);
  color:  #f14949;;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-mark-sold:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

/* 商品描述 */
.description-section {
  margin-bottom: 24px;
}

.description-section h3,
.seller-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.description-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
  position: relative;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.description-text.collapsed {
  max-height: 120px;
  position: relative;
}

.description-text.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.95));
  pointer-events: none;
}

/* Markdown 样式 */
.description-text :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0 8px 0;
}

.description-text :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 14px 0 6px 0;
}

.description-text :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 12px 0 4px 0;
}

.description-text :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.description-text :deep(em) {
  font-style: italic;
  color: var(--text-secondary);
}

.description-text :deep(ul) {
  padding-left: 20px;
  margin: 8px 0;
}

.description-text :deep(li) {
  margin: 4px 0;
  list-style-type: disc;
}

.btn-toggle-description {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--primary-color);
  border-radius: 20px;
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-toggle-description svg {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.btn-toggle-description:hover {
  background: rgba(255, 36, 66, 0.05);
  transform: translateY(-1px);
}

/* 详细信息列表 */
.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: var(--radius-md);
  margin-top: 16px; /* 与图片保持间距 */
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.detail-item .label {
  color: var(--text-tertiary);
}

.detail-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.status-available {
  color: #52c41a;
}

.status-sold {
  color: #f5222d;
}

.status-reserved {
  color: #fa8c16;
}

/* 卖家信息 */
.seller-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #fef5f7 0%, #f9f9f9 100%);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 36, 66, 0.1);
  transition: all var(--transition-base) var(--ease-in-out);
}

.seller-card.clickable {
  cursor: pointer;
}

.seller-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.15);
  border-color: rgba(255, 36, 66, 0.2);
}

.seller-card.clickable:hover .seller-name {
  color: var(--primary-color);
}

.seller-card.clickable:hover .goto-icon {
  transform: translateX(4px);
  color: var(--primary-color);
}

.goto-icon {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.seller-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.seller-details {
  flex: 1;
  min-width: 0;
}

.seller-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seller-meta {
  font-size: 13px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.seller-meta::before {
  content: '';
  font-size: 12px;
}

/* 响应式布局 */

/* 大屏桌面 */
@media (min-width: 1400px) {
  .product-layout {
    grid-template-columns: 450px 1fr;
    gap: 48px;
    padding: 40px 30px 40px 0; /* 左侧padding为0 */
    max-width: 100%;
  }

  .product-gallery {
    max-width: 450px;
  }
}

/* 中等屏幕 */
@media (min-width: 1025px) and (max-width: 1399px) {
  .product-layout {
    grid-template-columns: 450px 1fr;
    gap: 32px;
    padding: 40px 20px;
    max-width: 100%;
  }

  .product-title {
    font-size: 26px;
  }

  .price {
    font-size: 36px;
  }
}

/* iPad横屏 - 使用Web端横向布局 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .main-content {
    margin: 0 20px; /* 保持统一的左右20px边距 */
    padding: 32px 20px; /* 简化padding */
  }

  .product-layout {
    grid-template-columns: 380px 1fr; /* 左侧固定宽度，图片更小 */
    gap: 32px;
    padding: 32px 20px;
  }

  .product-gallery {
    padding: 16px;
    max-width: 380px;
  }

  .main-image {
    aspect-ratio: 1;
  }

  .product-info {
    padding: 24px;
  }

  .product-title {
    font-size: 22px;
    line-height: 1.4;
  }

  .price {
    font-size: 32px;
  }

  .description-section {
    margin-top: 20px;
  }

  .description-section h3 {
    font-size: 16px;
  }

  .description-text {
    font-size: 14px;
    line-height: 1.7;
  }

  .detail-list {
    gap: 12px;
  }

  .seller-section {
    margin-top: 20px;
  }
}

/* iPad竖屏 - 使用移动端纵向布局 */
@media (max-width: 1024px) and (orientation: portrait) {
  .page {
    padding-left: 0; /* 移动端无侧边栏 */
    padding-bottom: 80px; /* 底部导航栏空间 */
  }

  .main-content {
    margin: 0 auto; /* 居中 */
    padding: 20px 24px; /* 左右内边距适中 */
    max-width: 100%; /* 充分利用宽度 */
  }

  .detail-container {
    display: flex;
    flex-direction: column;
    align-items: center; /* 内容居中 */
  }

  .product-layout {
    grid-template-columns: 1fr; /* 单列布局 */
    gap: 24px;
    padding: 16px;
    width: 100%;
    max-width: 100%; /* 充分利用宽度 */
    margin: 0 auto;
  }

  .product-gallery {
    padding: 16px;
    width: 100%;
    max-width: 100%; /* 适应容器宽度 */
    margin: 0 auto; /* 居中显示 */
  }

  .main-image {
    aspect-ratio: 1;
  }

  .detail-list {
    width: 100%; /* 适应容器宽度 */
    margin: 16px 0 0; /* 居中显示 */
  }

  .product-info {
    padding: 16px;
    width: 100%;
  }

  .product-title {
    font-size: 20px;
    line-height: 1.4;
  }

  .price {
    font-size: 30px;
  }

  /* 移动端操作按钮始终可见 */
  .card-actions {
    bottom: 12px;
    left: 12px;
    right: 12px;
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  .action-btn {
    width: 48px;
    height: 48px;
  }

  .action-btn svg {
    width: 22px;
    height: 22px;
  }

  /* 移动端始终显示预览提示 */
  .preview-hint {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  .sold-watermark {
    font-size: 70px;
  }

  .thumbnails {
    gap: 8px;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
  }
}

/* 手机端额外优化 */
@media (max-width: 768px) {
  .main-content {
    margin: 0 auto; /* 居中 */
    padding: 16px;
    max-width: 100%;
  }

  .detail-container {
    display: flex;
    flex-direction: column;
    align-items: center; /* 内容居中 */
  }

  .back-btn {
    margin-bottom: 12px;
    font-size: 14px;
  }

  .product-layout {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
    width: 100%;
    margin: 0 auto;
  }

  .product-gallery {
    padding: 12px;
    width: 100%;
    max-width: 100%; /* 手机端充满宽度 */
    margin: 0 auto; /* 居中显示 */
  }

  .detail-list {
    width: 100%;
    margin: 12px 0 0; /* 居中显示 */
  }

  .product-info {
    padding: 16px;
    width: 100%;
  }

  .product-title {
    font-size: 18px;
  }

  .price {
    font-size: 28px;
  }

  .condition-tag {
    font-size: 12px;
    padding: 4px 10px;
  }

  .meta-info {
    flex-wrap: wrap;
    gap: 8px;
  }

  .meta-item {
    font-size: 12px;
  }

  .description-section h3,
  .seller-section h3 {
    font-size: 16px;
  }

  .description-text {
    font-size: 14px;
    line-height: 1.6;
  }

  .detail-list {
    gap: 10px;
  }

  .detail-item {
    padding: 10px;
  }

  .sold-watermark {
    font-size: 60px;
  }
}

/* 图片预览模态框 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  z-index: 10001;
}

.preview-counter {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
}

.btn-close {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close svg {
  width: 24px;
  height: 24px;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* 预览导航按钮 */
.preview-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10002;
}

.preview-nav-btn svg {
  width: 28px;
  height: 28px;
}

.preview-nav-btn.prev {
  left: -80px;
}

.preview-nav-btn.next {
  right: -80px;
}

.preview-nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) scale(1.1);
}

.preview-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 预览缩略图导航 */
.preview-thumbnails {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 40px;
  max-width: 90vw;
  overflow-x: auto;
  z-index: 10001;
}

.preview-thumbnails::-webkit-scrollbar {
  height: 4px;
}

.preview-thumbnails::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.preview-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-thumb:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.preview-thumb.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

/* 图片预览响应式 */

/* iPad和移动端 */
@media (max-width: 1024px) {
  .preview-nav-btn.prev {
    left: 20px;
  }

  .preview-nav-btn.next {
    right: 20px;
  }

  .preview-thumbnails {
    bottom: 20px;
    padding: 8px 16px;
    gap: 8px;
  }

  .preview-thumb {
    width: 50px;
    height: 50px;
  }
}

/* 手机端 */
@media (max-width: 768px) {
  .preview-header {
    padding: 16px 20px;
  }

  .btn-close {
    width: 40px;
    height: 40px;
  }

  .btn-close svg {
    width: 20px;
    height: 20px;
  }

  .preview-nav-btn {
    width: 44px;
    height: 44px;
  }

  .preview-nav-btn svg {
    width: 22px;
    height: 22px;
  }

  .preview-nav-btn.prev {
    left: 10px;
  }

  .preview-nav-btn.next {
    right: 10px;
  }

  .preview-counter {
    font-size: 14px;
    padding: 6px 12px;
  }

  .preview-thumb {
    width: 45px;
    height: 45px;
  }
}
</style>
