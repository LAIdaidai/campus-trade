/**
 * 图片预加载工具
 */

class ImagePreloader {
  constructor() {
    this.cache = new Map()
    this.loadingQueue = new Set()
    this.maxConcurrent = 10  // 进一步增加最大并发数
    this.currentLoading = 0
    this.defaultTimeout = 3000  // 进一步减少超时时间
  }

  /**
   * 预加载单张图片
   * @param {string} src - 图片URL
   * @param {Object} options - 选项
   * @returns {Promise<HTMLImageElement>}
   */
  async preload(src, options = {}) {
    if (!src) {
      throw new Error('图片URL不能为空')
    }

    // 如果已经缓存，直接返回
    if (this.cache.has(src)) {
      return this.cache.get(src)
    }

    // 如果正在加载，等待加载完成
    if (this.loadingQueue.has(src)) {
      return this.waitForLoad(src)
    }

    return this.loadImage(src, options)
  }

  /**
   * 批量预加载图片
   * @param {string[]} srcs - 图片URL数组
   * @param {Object} options - 选项
   * @returns {Promise<HTMLImageElement[]>}
   */
  async preloadBatch(srcs, options = {}) {
    if (!Array.isArray(srcs) || srcs.length === 0) {
      return []
    }

    // 过滤掉已缓存的图片
    const uncachedSrcs = srcs.filter(src => !this.cache.has(src))
    
    if (uncachedSrcs.length === 0) {
      return srcs.map(src => this.cache.get(src))
    }

    // 分批加载，避免同时加载太多图片
    const batchSize = this.maxConcurrent
    const results = []

    for (let i = 0; i < uncachedSrcs.length; i += batchSize) {
      const batch = uncachedSrcs.slice(i, i + batchSize)
      const batchPromises = batch.map(src => this.loadImage(src, options))
      
      try {
        const batchResults = await Promise.allSettled(batchPromises)
        results.push(...batchResults)
      } catch (error) {
        console.warn('批量预加载图片失败:', error)
      }
    }

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
  }

  /**
   * 加载单张图片
   * @param {string} src - 图片URL
   * @param {Object} options - 选项
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImage(src, options = {}) {
    return new Promise((resolve, reject) => {
      // 检查并发限制
      if (this.currentLoading >= this.maxConcurrent) {
        // 等待其他图片加载完成
        const checkInterval = setInterval(() => {
          if (this.currentLoading < this.maxConcurrent) {
            clearInterval(checkInterval)
            this.loadImage(src, options).then(resolve).catch(reject)
          }
        }, 50)
        return
      }

      this.loadingQueue.add(src)
      this.currentLoading++

      const img = new Image()
      
      // 设置图片属性
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin
      }

      img.onload = () => {
        this.cache.set(src, img)
        this.loadingQueue.delete(src)
        this.currentLoading--
        resolve(img)
      }

      img.onerror = (error) => {
        this.loadingQueue.delete(src)
        this.currentLoading--
        reject(new Error(`图片加载失败: ${src}`))
      }

      // 设置超时
      if (options.timeout) {
        setTimeout(() => {
          if (this.loadingQueue.has(src)) {
            this.loadingQueue.delete(src)
            this.currentLoading--
            reject(new Error(`图片加载超时: ${src}`))
          }
        }, options.timeout)
      }

      img.src = src
    })
  }

  /**
   * 等待指定图片加载完成
   * @param {string} src - 图片URL
   * @returns {Promise<HTMLImageElement>}
   */
  async waitForLoad(src) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.cache.has(src)) {
          clearInterval(checkInterval)
          resolve(this.cache.get(src))
        } else if (!this.loadingQueue.has(src)) {
          clearInterval(checkInterval)
          reject(new Error(`图片加载失败: ${src}`))
        }
      }, 50)
    })
  }

  /**
   * 预加载关键图片（首页、详情页等）
   * @param {string[]} criticalSrcs - 关键图片URL数组
   * @returns {Promise<void>}
   */
  async preloadCritical(criticalSrcs) {
    if (!Array.isArray(criticalSrcs) || criticalSrcs.length === 0) {
      return
    }

    try {
      await this.preloadBatch(criticalSrcs, {
        timeout: 10000, // 10秒超时
        crossOrigin: 'anonymous'
      })
      console.log('关键图片预加载完成')
    } catch (error) {
      console.warn('关键图片预加载失败:', error)
    }
  }

  /**
   * 预加载下一页图片（分页场景）
   * @param {string[]} nextPageSrcs - 下一页图片URL数组
   * @returns {Promise<void>}
   */
  async preloadNextPage(nextPageSrcs) {
    if (!Array.isArray(nextPageSrcs) || nextPageSrcs.length === 0) {
      return
    }

    // 延迟预加载，避免影响当前页面
    setTimeout(async () => {
      try {
        await this.preloadBatch(nextPageSrcs, {
          timeout: 15000, // 15秒超时
          crossOrigin: 'anonymous'
        })
        console.log('下一页图片预加载完成')
      } catch (error) {
        console.warn('下一页图片预加载失败:', error)
      }
    }, 1000)
  }

  /**
   * 清理缓存
   * @param {number} maxAge - 最大缓存时间（毫秒）
   */
  clearCache(maxAge = 300000) { // 默认5分钟
    const now = Date.now()
    for (const [src, img] of this.cache.entries()) {
      if (img.timestamp && now - img.timestamp > maxAge) {
        this.cache.delete(src)
      }
    }
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      loadingCount: this.currentLoading,
      queueSize: this.loadingQueue.size
    }
  }

  /**
   * 销毁预加载器
   */
  destroy() {
    this.cache.clear()
    this.loadingQueue.clear()
    this.currentLoading = 0
  }
}

// 创建全局实例
const imagePreloader = new ImagePreloader()

// 定期清理缓存
setInterval(() => {
  imagePreloader.clearCache()
}, 60000) // 每分钟清理一次

export default imagePreloader
export { ImagePreloader }
