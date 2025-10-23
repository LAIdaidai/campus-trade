/**
 * 性能监控工具
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      imageLoadTimes: [],
      totalImages: 0,
      failedImages: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
    
    this.observers = new Map()
    this.startTime = performance.now()
  }

  /**
   * 记录图片加载时间
   * @param {string} src - 图片URL
   * @param {number} loadTime - 加载时间（毫秒）
   * @param {boolean} fromCache - 是否来自缓存
   */
  recordImageLoad(src, loadTime, fromCache = false) {
    this.metrics.imageLoadTimes.push({
      src,
      loadTime,
      fromCache,
      timestamp: Date.now()
    })
    
    if (fromCache) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
  }

  /**
   * 记录图片加载失败
   * @param {string} src - 图片URL
   */
  recordImageError(src) {
    this.metrics.failedImages++
    console.warn('图片加载失败:', src)
  }

  /**
   * 记录总图片数
   * @param {number} count - 图片数量
   */
  recordTotalImages(count) {
    this.metrics.totalImages = count
  }

  /**
   * 获取性能统计
   * @returns {Object} 性能统计信息
   */
  getStats() {
    const { imageLoadTimes, totalImages, failedImages, cacheHits, cacheMisses } = this.metrics
    
    if (imageLoadTimes.length === 0) {
      return {
        totalImages,
        loadedImages: 0,
        failedImages,
        averageLoadTime: 0,
        cacheHitRate: 0,
        successRate: 0
      }
    }

    const loadedImages = imageLoadTimes.length
    const totalLoadTime = imageLoadTimes.reduce((sum, item) => sum + item.loadTime, 0)
    const averageLoadTime = totalLoadTime / loadedImages
    const cacheHitRate = cacheHits / (cacheHits + cacheMisses) * 100
    const successRate = loadedImages / (loadedImages + failedImages) * 100

    return {
      totalImages,
      loadedImages,
      failedImages,
      averageLoadTime: Math.round(averageLoadTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      totalTime: Math.round(performance.now() - this.startTime)
    }
  }

  /**
   * 获取慢加载图片列表
   * @param {number} threshold - 阈值（毫秒）
   * @returns {Array} 慢加载图片列表
   */
  getSlowImages(threshold = 2000) {
    return this.metrics.imageLoadTimes
      .filter(item => item.loadTime > threshold)
      .sort((a, b) => b.loadTime - a.loadTime)
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.metrics = {
      imageLoadTimes: [],
      totalImages: 0,
      failedImages: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
    this.startTime = performance.now()
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const stats = this.getStats()
    const slowImages = this.getSlowImages()
    
    console.group('📊 图片加载性能报告')
    console.log(`总图片数: ${stats.totalImages}`)
    console.log(`已加载: ${stats.loadedImages}`)
    console.log(`加载失败: ${stats.failedImages}`)
    console.log(`成功率: ${stats.successRate}%`)
    console.log(`平均加载时间: ${stats.averageLoadTime}ms`)
    console.log(`缓存命中率: ${stats.cacheHitRate}%`)
    console.log(`总耗时: ${stats.totalTime}ms`)
    
    if (slowImages.length > 0) {
      console.group('🐌 慢加载图片')
      slowImages.forEach(item => {
        console.log(`${item.src}: ${item.loadTime}ms`)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  /**
   * 监控页面性能
   */
  monitorPagePerformance() {
    // 监控页面加载时间
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      console.log(`页面加载完成: ${Math.round(loadTime)}ms`)
    })

    // 监控资源加载
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            this.recordImageLoad(
              entry.name,
              entry.responseEnd - entry.startTime,
              entry.transferSize === 0 // 如果传输大小为0，说明来自缓存
            )
          }
        }
      })
      
      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    }
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor()

// 自动开始监控
performanceMonitor.monitorPagePerformance()

// 定期打印报告
setInterval(() => {
  const stats = performanceMonitor.getStats()
  if (stats.loadedImages > 0) {
    performanceMonitor.printReport()
  }
}, 30000) // 每30秒打印一次

export default performanceMonitor
export { PerformanceMonitor }
