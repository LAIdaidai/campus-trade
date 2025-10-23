import { onActivated, onDeactivated } from 'vue'

// 全局存储滚动位置
const scrollPositions = new Map()

/**
 * 使用滚动位置记忆的 composable
 * 在 keep-alive 组件中保存和恢复滚动位置
 */
export function useScrollPosition(key) {
  // 保存滚动位置
  const saveScrollPosition = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    scrollPositions.set(key, scrollTop)
    
  }
  
  // 恢复滚动位置
  const restoreScrollPosition = () => {
    const savedPosition = scrollPositions.get(key)
    
    if (savedPosition !== undefined && savedPosition > 0) {
      
      
      // 立即设置滚动位置，不使用平滑滚动
      const scrollToPosition = () => {
        // 直接设置 scrollTop，最快速的方式
        document.documentElement.scrollTop = savedPosition
        window.pageYOffset = savedPosition
        
      }
      
      // 立即执行一次
      scrollToPosition()
      
      // 在下一帧再确认一次，防止 DOM 重排导致位置偏移
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const currentScroll = window.pageYOffset || document.documentElement.scrollTop
          if (Math.abs(currentScroll - savedPosition) > 10) {
            
            scrollToPosition()
          }
        })
      })
    } else {
      
    }
  }
  
  // keep-alive 停用时（离开去其他页面）
  onDeactivated(() => {
    
    saveScrollPosition()
  })
  
  // keep-alive 激活时（从其他页面返回）
  onActivated(() => {
    
    // 使用 setTimeout 0 确保在 DOM 更新后立即执行
    setTimeout(() => {
      restoreScrollPosition()
    }, 0)
  })
  
  return {
    saveScrollPosition,
    restoreScrollPosition
  }
}
