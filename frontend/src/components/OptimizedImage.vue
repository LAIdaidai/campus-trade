<template>
  <div class="optimized-image-container" :style="{ aspectRatio: aspectRatio }">
    <!-- 占位符 -->
    <div v-if="!imageLoaded && !imageError" class="image-placeholder">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <div class="placeholder-text">加载中...</div>
      </div>
    </div>
    
    <!-- 错误占位符 -->
    <div v-if="imageError" class="image-error">
      <div class="error-content">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div class="error-text">图片加载失败</div>
        <button v-if="showRetry" @click="retryLoad" class="retry-btn">重试</button>
      </div>
    </div>
    
    <!-- 实际图片 -->
    <img
      v-show="imageLoaded && !imageError"
      :src="optimizedSrc"
      :alt="alt"
      :class="['optimized-image', { 'image-loaded': imageLoaded }]"
      :loading="lazy ? 'lazy' : 'eager'"
      @load="handleImageLoad"
      @error="handleImageError"
      @click="handleClick"
    />
    
    <!-- 移除加载进度条 -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { getImageUrl } from '@/config'
import imagePreloader from '@/utils/imagePreloader'
import performanceMonitor from '@/utils/performanceMonitor'

const props = defineProps({
  // 图片源
  src: {
    type: String,
    required: true
  },
  // 替代文本
  alt: {
    type: String,
    default: ''
  },
  // 是否懒加载
  lazy: {
    type: Boolean,
    default: false  // 默认不懒加载，避免浏览器干预
  },
  // 宽高比
  aspectRatio: {
    type: String,
    default: '1/1'
  },
  // 是否显示重试按钮
  showRetry: {
    type: Boolean,
    default: true
  },
  // 图片质量 (1-100)
  quality: {
    type: Number,
    default: 80  // 降低默认质量以提高加载速度
  },
  // 最大宽度
  maxWidth: {
    type: Number,
    default: 400  // 降低默认宽度以提高加载速度
  }
})

const emit = defineEmits(['load', 'error', 'click'])

const imageLoaded = ref(false)
const imageError = ref(false)
const loadingProgress = ref(0)
const retryCount = ref(0)
const maxRetries = 3

// 优化的图片源
const optimizedSrc = computed(() => {
  if (!props.src) return ''
  
  return getImageUrl(props.src, {
    quality: props.quality,
    width: props.maxWidth,
    webp: true
  })
})

// 处理图片加载成功
const handleImageLoad = (event) => {
  imageLoaded.value = true
  imageError.value = false
  loadingProgress.value = 100
  
  // 记录性能数据
  const loadTime = performance.now() - (event.target._startTime || 0)
  performanceMonitor.recordImageLoad(optimizedSrc.value, loadTime, event.target.complete)
  
  // 添加淡入动画
  nextTick(() => {
    const img = event.target
    img.style.opacity = '0'
    img.style.transition = 'opacity 0.3s ease'
    requestAnimationFrame(() => {
      img.style.opacity = '1'
    })
  })
  
  emit('load', event)
}

// 处理图片加载错误
const handleImageError = (event) => {
  console.warn('图片加载失败:', props.src, '生成URL:', optimizedSrc.value)
  
  // 记录错误
  performanceMonitor.recordImageError(optimizedSrc.value)
  
  if (retryCount.value < maxRetries) {
    retryCount.value++
    console.log(`尝试重新加载图片 (${retryCount.value}/${maxRetries})`)
    
    // 延迟重试
    setTimeout(() => {
      const img = event.target
      img.src = img.src + '?retry=' + retryCount.value
    }, 1000 * retryCount.value)
  } else {
    imageError.value = true
    imageLoaded.value = false
    loadingProgress.value = 0
  }
  
  emit('error', event)
}

// 重试加载
const retryLoad = () => {
  imageError.value = false
  retryCount.value = 0
  loadingProgress.value = 0
  
  // 强制重新加载
  const img = document.querySelector('.optimized-image')
  if (img) {
    img.src = optimizedSrc.value + '?retry=' + Date.now()
  }
}

// 处理点击事件
const handleClick = (event) => {
  emit('click', event)
}

// 快速加载，不显示进度
const simulateProgress = () => {
  loadingProgress.value = 100
}

// 预加载图片
const preloadImage = async () => {
  if (!props.src) return
  
  try {
    // 记录开始时间
    const startTime = performance.now()
    
    // 预加载图片
    await imagePreloader.preload(optimizedSrc.value, {
      timeout: 10000,
      crossOrigin: 'anonymous'
    })
    
    // 记录预加载时间
    const loadTime = performance.now() - startTime
    performanceMonitor.recordImageLoad(optimizedSrc.value, loadTime, true)
  } catch (error) {
    console.warn('图片预加载失败:', error)
    performanceMonitor.recordImageError(optimizedSrc.value)
  }
}

// 监听图片源变化
watch(() => props.src, () => {
  imageLoaded.value = false
  imageError.value = false
  loadingProgress.value = 0
  retryCount.value = 0
  
  if (props.src) {
    simulateProgress()
    // 如果不是懒加载，立即预加载
    if (!props.lazy) {
      preloadImage()
    }
  }
}, { immediate: true })

// 组件挂载时开始模拟进度
onMounted(() => {
  if (props.src && !props.lazy) {
    simulateProgress()
    preloadImage()
  }
})
</script>

<style scoped>
.optimized-image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 8px;
}

.optimized-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.optimized-image.image-loaded {
  opacity: 1;
}

/* 占位符样式 */
.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.placeholder-content {
  text-align: center;
  color: #999;
}

.placeholder-icon {
  width: 32px;
  height: 32px;
  margin: 0 auto 8px;
  opacity: 0.6;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.placeholder-text {
  font-size: 12px;
  color: #999;
}

/* 错误占位符样式 */
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.error-content {
  text-align: center;
  color: #999;
}

.error-icon {
  width: 32px;
  height: 32px;
  margin: 0 auto 8px;
  opacity: 0.6;
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

.error-text {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.retry-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #e0e0e0;
  color: #333;
}

/* 加载进度条 */
.loading-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

/* 闪烁动画 */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .placeholder-icon,
  .error-icon {
    width: 24px;
    height: 24px;
  }
  
  .placeholder-text,
  .error-text {
    font-size: 11px;
  }
}
</style>
