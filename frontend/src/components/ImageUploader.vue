<template>
  <div class="image-uploader">
    <div class="upload-list">
      <!-- 已上传的图片 -->
      <div 
        v-for="(image, index) in imageList" 
        :key="index" 
        class="upload-item"
      >
        <img 
          :src="getImageUrl(image)" 
          alt="商品图片" 
          loading="eager"
          @load="onImageLoad(image, index)"
          @error="onImageError(image, index)"
        />
        <div class="upload-item-actions">
          <button @click="previewImage(image)" class="btn-preview" title="预览">
            <Icon name="eye" />
          </button>
          <button @click="removeImage(index)" class="btn-remove" title="删除">
            <Icon name="trash" />
          </button>
        </div>
        <div v-if="image.uploading" class="upload-progress">
          <div class="progress-bar" :style="{ width: image.progress + '%' }"></div>
        </div>
      </div>

      <!-- 上传按钮 -->
      <div 
        v-if="imageList.length < maxCount" 
        class="upload-trigger"
        @click="triggerUpload"
      >
        <!-- 图片选择 -->
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          :multiple="multiple"
          @change="handleFileChange"
          style="display: none"
        />
        
        <div class="upload-content">
          <div class="upload-text">
            <Icon name="image" />
            <span>上传图片</span>
          </div>
          <div class="upload-hint">{{ imageList.length }}/{{ maxCount }}</div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <transition name="fade">
      <div v-if="previewVisible" class="preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
          <img :src="previewImageUrl" alt="预览" />
          <button class="btn-close" @click="closePreview">✕</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { uploadSingleImage, uploadMultipleImages, deleteImage } from '@/api/upload'
import { getImageUrl as getFullImageUrl } from '@/config'
import { smartCompress, createThumbnail } from '@/utils/imageCompress'
import Icon from './Icon.vue'
import toast from '@/utils/toast'
import { showDeleteConfirm } from '@/utils/dialog'

const props = defineProps({
  // 已上传的图片列表 (URL数组)
  modelValue: {
    type: Array,
    default: () => []
  },
  // 最大上传数量
  maxCount: {
    type: Number,
    default: 9
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const fileInput = ref(null)
const imageList = ref([])
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 初始化图片列表
const initImageList = () => {
  if (props.modelValue && props.modelValue.length > 0) {
    imageList.value = props.modelValue.map(url => ({
      url: typeof url === 'string' ? url : url.url || url,
      uploading: false,
      progress: 100
    }))
    console.log('初始化图片列表:', imageList.value)
  }
}

// 初始化
initImageList()

// 监听props.modelValue变化
watch(() => props.modelValue, (newValue) => {
  console.log('props.modelValue变化:', newValue)
  initImageList()
}, { deep: true })

// 获取图片完整URL
const getImageUrl = (image) => {
  let url = ''
  if (typeof image === 'string') {
    url = image
  } else if (image && typeof image === 'object') {
    url = image.url || image
  } else {
    url = image
  }
  
  const fullUrl = getFullImageUrl(url)
  console.log('构建图片URL:', { original: url, full: fullUrl })
  return fullUrl
}

// 触发文件选择
const triggerUpload = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileChange = async (event) => {
  const files = Array.from(event.target.files || [])
  
  if (files.length === 0) return
  
  // 检查数量限制
  const remainingSlots = props.maxCount - imageList.value.length
  if (files.length > remainingSlots) {
    toast.warning(`最多只能上传 ${props.maxCount} 张图片，还可以上传 ${remainingSlots} 张`)
    return
  }
  
  // 检查文件大小（提高限制，因为会自动压缩）
  const maxSize = 20 * 1024 * 1024
  const oversizedFiles = files.filter(file => file.size > maxSize)
  if (oversizedFiles.length > 0) {
    toast.warning('部分图片超过20MB限制，请压缩后上传')
    return
  }
  
  // 如果是多选，批量上传
  if (props.multiple && files.length > 1) {
    await uploadMultiple(files)
  } else {
    // 单张上传
    for (const file of files) {
      await uploadSingle(file)
    }
  }
  
  // 清空文件选择
  event.target.value = ''
}

// 上传单张图片
const uploadSingle = async (file) => {
  // 添加到列表显示
  const imageItem = {
    url: URL.createObjectURL(file),
    uploading: true,
    progress: 0,
    file
  }
  imageList.value.push(imageItem)
  
  try {
    // 智能压缩图片
    imageItem.progress = 20
    const compressedFile = await smartCompress(file)
    imageItem.progress = 40
    
    // 创建缩略图用于预览
    const thumbnail = await createThumbnail(compressedFile, { width: 200, height: 200 })
    imageItem.url = URL.createObjectURL(thumbnail)
    imageItem.progress = 60
    
    const response = await uploadSingleImage(compressedFile, 'products')
    
    if (response.success) {
      // 更新为服务器返回的URL
      imageItem.url = response.data.url
      imageItem.uploading = false
      imageItem.progress = 100
      
      console.log('单张图片上传成功:', response.data.url)
      updateModelValue()
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    toast.error('上传失败: ' + (error.response?.data?.message || error.message))
    // 移除失败的项
    const index = imageList.value.indexOf(imageItem)
    if (index > -1) {
      imageList.value.splice(index, 1)
    }
  }
}

// 批量上传
const uploadMultiple = async (files) => {
  // 创建临时预览
  const tempItems = files.map(file => ({
    url: URL.createObjectURL(file),
    uploading: true,
    progress: 0,
    file
  }))
  imageList.value.push(...tempItems)
  
  try {
    // 批量压缩图片
    tempItems.forEach((item, index) => {
      item.progress = 10 + (index * 5) // 分配进度
    })
    
    const compressedFiles = await Promise.all(
      files.map(file => smartCompress(file))
    )
    
    // 更新进度
    tempItems.forEach((item, index) => {
      item.progress = 30 + (index * 5)
    })
    
    const response = await uploadMultipleImages(compressedFiles, 'products')
    
    if (response.success) {
      // 更新为服务器返回的URL
      response.data.forEach((uploadedImage, index) => {
        const item = tempItems[index]
        if (item) {
          item.url = uploadedImage.url
          item.uploading = false
          item.progress = 100
          console.log('批量上传图片成功:', uploadedImage.url)
        }
      })
      
      updateModelValue()
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error) {
    console.error('批量上传失败:', error)
    toast.error('上传失败: ' + (error.response?.data?.message || error.message))
    // 移除失败的项
    tempItems.forEach(item => {
      const index = imageList.value.indexOf(item)
      if (index > -1) {
        imageList.value.splice(index, 1)
      }
    })
  }
}

// 移除图片
const removeImage = async (index) => {
  const image = imageList.value[index]
  
  const confirmed = await showDeleteConfirm('确定要删除这张图片吗？')
  
  if (!confirmed) return
  
  try {
    // 如果是服务器上的图片，调用删除接口
    if (image.url && image.url.includes('/uploads/')) {
      const filename = image.url.split('/').pop()
      await deleteImage(filename, 'products')
    }
    
    imageList.value.splice(index, 1)
    updateModelValue()
  } catch (error) {
    console.error('删除图片失败:', error)
    // 即使删除接口失败，也从列表移除
    imageList.value.splice(index, 1)
    updateModelValue()
  }
}

// 预览图片
const previewImage = (image) => {
  previewImageUrl.value = getImageUrl(image)
  previewVisible.value = true
}

// 关闭预览
const closePreview = () => {
  previewVisible.value = false
  previewImageUrl.value = ''
}

// 图片加载成功
const onImageLoad = (image, index) => {
  console.log('图片加载成功:', { image, index, url: getImageUrl(image) })
}

// 图片加载失败
const onImageError = (image, index) => {
  console.error('图片加载失败:', { image, index, url: getImageUrl(image) })
}

// 更新 v-model
const updateModelValue = () => {
  const urls = imageList.value
    .filter(item => !item.uploading)
    .map(item => {
      // 确保返回的是字符串URL
      const url = typeof item.url === 'string' ? item.url : item.url?.url || item.url
      console.log('更新图片URL:', url)
      return url
    })
  console.log('最终图片URL数组:', urls)
  emit('update:modelValue', urls)
  emit('change', urls)
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 100%;
}

.upload-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 1:1 比例 */
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-item-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 桌面端hover显示 */
@media (hover: hover) and (pointer: fine) {
  .upload-item:hover .upload-item-actions {
    opacity: 1;
  }
}

/* 移动端/触摸设备始终显示操作按钮 */
@media (hover: none) or (pointer: coarse) {
  .upload-item-actions {
    opacity: 1;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.6) 100%);
  }
  
  .btn-preview,
  .btn-remove {
    width: 44px;
    height: 44px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

.btn-preview,
.btn-remove {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base) var(--ease-in-out);
  padding: 8px;
}

.btn-preview :deep(svg),
.btn-remove :deep(svg) {
  width: 18px;
  height: 18px;
  color: var(--text-primary);
  transition: color var(--transition-base) var(--ease-in-out) ease;
}

.btn-preview:hover {
  background: var(--primary-color);
  transform: scale(1.1);
}

.btn-preview:hover :deep(svg) {
  color: #fff;
}

.btn-remove:hover {
  background: #ff4d4f;
  transform: scale(1.1);
}

.btn-remove:hover :deep(svg) {
  color: #fff;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 100%);
  transition: width 0.3s ease;
}

.upload-trigger {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  transition: all var(--transition-base) var(--ease-in-out);
}

.upload-trigger:hover {
  background: rgba(0, 0, 0, 0.02);
}

.upload-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  transition: color var(--transition-base) var(--ease-in-out);
}

.upload-trigger:hover .upload-text {
  color: var(--primary-color);
}

.upload-text :deep(svg) {
  width: 32px;
  height: 32px;
  stroke-width: 1.5;
  color: inherit;
}

.upload-text span {
  font-size: 14px;
  font-weight: 500;
  color: inherit;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* 预览弹窗 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  cursor: default;
}

.preview-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.btn-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: rotate(90deg);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端响应式优化 */
@media (max-width: 480px) {
  .upload-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .upload-text {
    gap: 6px;
  }
  
  .upload-text :deep(svg) {
    width: 28px;
    height: 28px;
  }
  
  .upload-text span {
    font-size: 13px;
  }
  
  .upload-hint {
    font-size: 11px;
  }
}

/* 大屏手机和平板优化 */
@media (min-width: 481px) and (max-width: 768px) {
  .upload-list {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .upload-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .btn-preview,
  .btn-remove {
    width: 32px;
    height: 32px;
  }
  
  .btn-preview :deep(svg),
  .btn-remove :deep(svg) {
    width: 16px;
    height: 16px;
  }
}
</style>
