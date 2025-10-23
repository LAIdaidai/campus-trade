/**
 * 图片压缩工具
 */

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.quality - 压缩质量 (0-1)
 * @param {number} options.maxWidth - 最大宽度
 * @param {number} options.maxHeight - 最大高度
 * @param {string} options.type - 输出格式
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export function compressImage(file, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    type = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }

      // 设置canvas尺寸
      canvas.width = width
      canvas.height = height

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        type,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 批量压缩图片
 * @param {File[]} files - 图片文件数组
 * @param {Object} options - 压缩选项
 * @returns {Promise<Blob[]>} 压缩后的图片Blob数组
 */
export async function compressImages(files, options = {}) {
  const results = []
  
  for (const file of files) {
    try {
      const compressed = await compressImage(file, options)
      results.push(compressed)
    } catch (error) {
      console.warn('图片压缩失败:', file.name, error)
      // 压缩失败时返回原文件
      results.push(file)
    }
  }
  
  return results
}

/**
 * 获取图片尺寸
 * @param {File} file - 图片文件
 * @returns {Promise<{width: number, height: number}>} 图片尺寸
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    
    img.onerror = () => {
      reject(new Error('无法获取图片尺寸'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 检查图片是否需要压缩
 * @param {File} file - 图片文件
 * @param {Object} options - 检查选项
 * @param {number} options.maxSize - 最大文件大小（字节）
 * @param {number} options.maxWidth - 最大宽度
 * @param {number} options.maxHeight - 最大高度
 * @returns {Promise<boolean>} 是否需要压缩
 */
export async function shouldCompress(file, options = {}) {
  const {
    maxSize = 2 * 1024 * 1024, // 2MB
    maxWidth = 1920,
    maxHeight = 1080
  } = options

  // 检查文件大小
  if (file.size > maxSize) {
    return true
  }

  try {
    // 检查图片尺寸
    const { width, height } = await getImageDimensions(file)
    return width > maxWidth || height > maxHeight
  } catch (error) {
    console.warn('无法检查图片尺寸:', error)
    return true // 出错时默认压缩
  }
}

/**
 * 智能压缩图片（根据文件大小和尺寸自动选择压缩参数）
 * @param {File} file - 图片文件
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export async function smartCompress(file) {
  const shouldCompressFile = await shouldCompress(file)
  
  if (!shouldCompressFile) {
    return file
  }

  // 根据文件大小选择压缩质量
  let quality = 0.8
  if (file.size > 5 * 1024 * 1024) { // 5MB以上
    quality = 0.6
  } else if (file.size > 2 * 1024 * 1024) { // 2MB以上
    quality = 0.7
  }

  // 根据文件类型选择输出格式
  let type = 'image/jpeg'
  if (file.type === 'image/png' && file.size < 1024 * 1024) { // 小于1MB的PNG保持原格式
    type = 'image/png'
  }

  return compressImage(file, {
    quality,
    maxWidth: 1920,
    maxHeight: 1080,
    type
  })
}

/**
 * 创建缩略图
 * @param {File} file - 图片文件
 * @param {Object} options - 缩略图选项
 * @param {number} options.width - 缩略图宽度
 * @param {number} options.height - 缩略图高度
 * @param {number} options.quality - 压缩质量
 * @returns {Promise<Blob>} 缩略图Blob
 */
export function createThumbnail(file, options = {}) {
  const {
    width = 300,
    height = 300,
    quality = 0.7
  } = options

  return compressImage(file, {
    quality,
    maxWidth: width,
    maxHeight: height,
    type: 'image/jpeg'
  })
}

export default {
  compressImage,
  compressImages,
  getImageDimensions,
  shouldCompress,
  smartCompress,
  createThumbnail
}
