<template>
  <div class="xhs-card" @click="goToDetail">
    <!-- 商品图片 -->
    <div class="card-image">
      <OptimizedImage
        :src="product.image"
        :alt="product.title"
        :lazy="false"
        :quality="80"
        :max-width="300"
        aspect-ratio="1/1"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <!-- 已售出水印 -->
      <div v-if="product.status === 'sold'" class="sold-overlay">
        <div class="sold-watermark">已售出</div>
      </div>
      
      <!-- 删除图标 (在收藏页面显示，无论是否售出) -->
      <div 
        v-if="showDeleteIcon" 
        class="delete-icon" 
        :class="{ 'force-show': forceShowDelete }"
        @click.stop="handleDelete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="card-content">
      <h3 class="card-title">{{ product.title }}</h3>
      
      <div class="card-footer">
        <div class="price-info">
          <span class="price">¥{{ product.price }}</span>
          <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
        </div>
        
        <div class="seller-info">
          <img :src="getImageUrl(product.sellerAvatar)" :alt="product.sellerName" class="avatar" />
          <span class="seller-name">{{ product.sellerName }}</span>
        </div>
      </div>

      <!-- 点赞和浏览 -->
      <div class="meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span>{{ product.favoriteCount ?? product.favorite_count ?? 0 }} 人收藏</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getImageUrl } from '@/config'
import OptimizedImage from './OptimizedImage.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  showDeleteIcon: {
    type: Boolean,
    default: false
  },
  forceShowDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete'])

const router = useRouter()
const isFavorite = ref(false)
const isLiked = ref(false)
const likes = ref(Math.floor(Math.random() * 500))

function handleImageLoad() {
  // 图片加载成功处理
}

function handleImageError() {
  // 图片加载失败处理
}

function goToDetail() {
  router.push(`/product/${props.product.id}`)
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value
}

function toggleLike() {
  isLiked.value = !isLiked.value
  likes.value += isLiked.value ? 1 : -1
}

function contactSeller() {
  // 跳转到商品详情页或消息页面
  router.push(`/product/${props.product.id}`)
}

function handleDelete() {
  emit('delete', props.product.id)
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}
</script>

<style scoped>
.xhs-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.xhs-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 图片容器 */
.card-image {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
  aspect-ratio: 1 / 1; /* 保持正方形比例 */
}

.xhs-card:hover .card-image {
  transform: scale(1.02);
}

/* 已售出遮罩和水印 */
.sold-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
}

.sold-watermark {
  font-size: 40px;
  font-weight: 900;
  font-style: italic;
  color: rgba(255, 0, 0, 0.6);
  text-shadow: 
    2px 2px 4px rgba(255, 255, 255, 0.8),
    -2px -2px 4px rgba(255, 255, 255, 0.8);
  transform: rotate(-25deg);
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
}

/* 删除图标 */
.delete-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 1; /* 默认显示 */
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 3;
  pointer-events: auto; /* 确保可点击 */
}

/* 强制显示模式（收藏页面） */
.delete-icon.force-show {
  opacity: 1 !important;
}

.xhs-card:hover .delete-icon {
  transform: scale(1.05);
}

.delete-icon svg {
  width: 22px;
  height: 22px;
  color: #ff4757;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-icon:hover {
  background: #ff4757;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.delete-icon:hover svg {
  color: #fff;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

/* 操作按钮容器 */
.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.xhs-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

/* 操作按钮 */
.action-btn {
  width: 36px;
  height: 36px;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.action-btn svg {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.favorite-btn:hover svg {
  color: #ff4757;
}

.favorite-btn.active {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.4);
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
  box-shadow: 0 6px 20px rgba(255, 36, 66, 0.5);
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1.1); }
}

/* 内容区域 */
.card-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-title {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary);
  margin: 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  min-height: 45px;
}

/* 底部信息 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: #ff4757;
}

.original-price {
  font-size: 12px;
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.seller-name {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 点赞和浏览 */
.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.meta-item svg {
  width: 14px;
  height: 14px;
  transition: all var(--transition-base) var(--ease-in-out);
}

.meta-item:hover {
  color: var(--primary-color);
}

.meta-item:hover svg {
  stroke: var(--primary-color);
}

.meta-item.liked {
  color: var(--primary-color);
}

.meta-item.liked svg {
  fill: var(--primary-color);
  stroke: var(--primary-color);
  animation: likeAnimation 0.5s ease;
}

@keyframes likeAnimation {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1.1); }
}

/* 响应式 */
@media (max-width: 968px) {
  .sold-watermark {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .card-content {
    padding: 6px;
  }

  .card-title {
    font-size: 11px;
    min-height: 32px;
    line-height: 1.3;
  }

  .price {
    font-size: 13px;
    margin-bottom: 2px;
  }

  .card-footer {
    margin-top: 4px;
    font-size: 9px;
  }

  .tag {
    padding: 1px 4px;
    font-size: 9px;
    border-radius: 3px;
  }

  /* 移动端始终显示收藏按钮 */
  .favorite-btn {
    opacity: 1 !important;
    transform: scale(1) !important;
    width: 24px;
    height: 24px;
    top: 6px;
    right: 6px;
  }

  .favorite-btn svg {
    width: 12px;
    height: 12px;
  }

  /* 移动端始终显示删除图标 */
  .delete-icon {
    opacity: 1 !important;
    transform: scale(1) !important;
    width: 24px;
    height: 24px;
    top: 6px;
    right: 6px;
  }

  .delete-icon svg {
    width: 12px;
    height: 12px;
  }

  /* 移动端始终显示操作按钮容器 */
  .card-actions {
    opacity: 1 !important;
    transform: translateY(0) !important;
    padding: 4px;
    gap: 4px;
  }

  /* 移动端始终显示所有操作按钮 */
  .action-btn {
    opacity: 1 !important;
    transform: scale(1) !important;
    padding: 4px 8px;
    font-size: 10px;
    border-radius: 4px;
  }

  .action-btn svg {
    width: 10px;
    height: 10px;
  }
}

@media (max-width: 640px) {
  .sold-watermark {
    font-size: 24px;
  }
}
</style>
