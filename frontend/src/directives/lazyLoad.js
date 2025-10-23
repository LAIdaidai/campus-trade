/**
 * 图片懒加载指令
 */

// 创建 Intersection Observer 实例
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      const src = img.dataset.src
      
      if (src) {
        // 加载图片
        img.src = src
        img.removeAttribute('data-src')
        
        // 停止观察这个元素
        observer.unobserve(img)
      }
    }
  })
}, {
  // 提前200px开始加载，避免浏览器干预
  rootMargin: '200px',
  threshold: 0.01
})

// 懒加载指令
export const lazyLoad = {
  mounted(el, binding) {
    // 设置占位符
    el.style.backgroundColor = '#f5f5f5'
    el.style.backgroundImage = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)'
    el.style.backgroundSize = '200% 100%'
    el.style.animation = 'shimmer 1.5s infinite'
    
    // 存储原始src
    el.dataset.src = binding.value
    
    // 开始观察
    observer.observe(el)
  },
  
  updated(el, binding) {
    // 如果src发生变化，更新data-src
    if (binding.value !== binding.oldValue) {
      el.dataset.src = binding.value
    }
  },
  
  unmounted(el) {
    // 停止观察
    observer.unobserve(el)
  }
}

// 添加CSS动画
const style = document.createElement('style')
style.textContent = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`
document.head.appendChild(style)

export default lazyLoad
