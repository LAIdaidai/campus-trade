<template>
  <div class="home-page">
    <!-- 固定头部区域 -->
    <div class="fixed-header">
      <!-- 搜索框 -->
      <div class="search-section">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="搜索校园二手好物..." 
            class="search-input"
            @keyup.enter="handleSearch"
            v-model="searchKeyword"
          />
          <button 
            v-if="searchKeyword" 
            class="clear-btn" 
            @click="clearSearch"
            title="清除搜索"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <button 
            class="search-btn" 
            @click="handleSearch"
            title="搜索"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="categories">
        <button 
          v-for="category in categories" 
          :key="category.id"
          :class="['category-btn', { active: currentCategory === category.id }]"
          @click="currentCategory = category.id"
        >
          <span>{{ category.name }}</span>
        </button>
      </div>
    </div>

    <!-- 可滚动内容区域 -->
    <main class="main-content">
      <!-- 商品网格 -->
      <transition name="fade" mode="out-in">
        <div class="products-grid" :key="currentCategory">
          <XHSProductCard 
            v-for="item in filteredProducts" 
            :key="item.id"
            :product="item" 
          />
        </div>
      </transition>

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore && filteredProducts.length > 0">
        <button class="load-more-btn" @click="loadMore">
          加载更多
        </button>
      </div>

      <!-- 空状态 -->
      <transition name="fade-empty">
        <div class="empty-state" v-if="filteredProducts.length === 0" :key="'empty-' + currentCategory">
          <div class="empty-icon"><Icon name="box" /></div>
          <p>暂无商品</p>
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import XHSProductCard from '@/components/XHSProductCard.vue'
import Icon from '@/components/Icon.vue'
import { getCategories } from '@/api/category'
import { getProducts } from '@/api/product'
import { getImageUrl } from '@/config'
import imagePreloader from '@/utils/imagePreloader'

defineOptions({
  name: 'Home'
})

// 数据库类别名到前端分类ID的映射
const categoryMap = {
  '电子产品': 'electronics',
  '图书教材': 'books',
  '服装鞋帽': 'clothes',
  '生活用品': 'daily',
  '运动器材': 'sports',
  '美妆护肤': 'beauty',
  '数码配件': 'digital',
  '文具用品': 'stationery',
  '食品饮料': 'food',
  '其他': 'other'
}

// 分类数据
const categories = ref([
  { id: 'all', name: '全部' }
])
const currentCategory = ref('all')
const hasMore = ref(true)
const loading = ref(false)
const products = ref([])
const offset = ref(0)
const limit = 20
const searchKeyword = ref('')

// 获取类别列表
const fetchCategories = async () => {
  try {
    const response = await getCategories()
    if (response.success) {
      // 将数据库类别转换为前端格式(不再使用数据库的icon字段)
      const dbCategories = response.data.map(cat => ({
        id: categoryMap[cat.name] || 'other',
        name: cat.name,
        dbName: cat.name // 保存数据库中的原始名称
      }))
      categories.value = [
        { id: 'all', name: '全部' },
        ...dbCategories
      ]
    }
  } catch (error) {
    console.error('获取类别失败:', error)
    // 失败时使用默认分类
  }
}

// 获取商品列表
const fetchProducts = async (reset = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    if (reset) {
      offset.value = 0
      products.value = []
    }
    
    const params = {
      limit,
      offset: offset.value,
      status: 'available'
    }
    
    // 添加搜索关键词
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim()
    }
    
    // 如果不是"全部"分类,需要传递数据库中的类别名称
    if (currentCategory.value !== 'all') {
      const currentCat = categories.value.find(c => c.id === currentCategory.value)
      if (currentCat && currentCat.dbName) {
        params.category = currentCat.dbName
      }
    }
    
    const response = await getProducts(params)
    if (response.success) {
      // 转换数据格式以适配前端 ProductCard 组件
      const formattedProducts = response.data.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: null, // 数据库没有原价字段
        image: product.images && product.images.length > 0 
          ? getImageUrl(product.images[0])
          : 'https://picsum.photos/400/400?random=' + product.id,
        location: '校园', // 可以后续添加位置字段
        views: 0, // 可以后续添加浏览量字段
        favoriteCount: product.favorite_count ?? product.favoriteCount ?? 0, // 收藏人数
        sellerAvatar: product.seller_avatar 
          ? getImageUrl(product.seller_avatar)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller_name || '用户')}&background=ff2442&color=fff&size=80`,
        sellerName: product.seller_name || '匿名用户',
        publishTime: formatTime(product.created_at),
        status: product.status,
        category: categoryMap[product.category] || 'other'
      }))
      
      if (reset) {
        products.value = formattedProducts
      } else {
        products.value = [...products.value, ...formattedProducts]
      }
      
      // 预加载图片以提高显示速度
      const imageUrls = formattedProducts
        .filter(p => p.image && !p.image.includes('picsum.photos'))
        .map(p => p.image)
      
      if (imageUrls.length > 0) {
        imagePreloader.preloadBatch(imageUrls, { timeout: 3000 })
          .catch(err => console.warn('图片预加载失败:', err))
      }
      
      hasMore.value = response.pagination?.hasMore || false
      offset.value += limit
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 重置并重新加载商品
  fetchProducts(true)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  fetchProducts(true)
}

// 监听搜索关键词变化（防抖）
let searchTimer = null
watch(searchKeyword, (newVal) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchProducts(true)
  }, 500) // 500ms 防抖
})

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 临时模拟数据（作为后备数据）
const mockProducts = ref([
  {
    id: 1,
    title: 'iPhone 13 Pro Max 256G 深空灰 99新',
    price: 6999,
    originalPrice: 9999,
    image: 'https://picsum.photos/400/400?random=1',
    location: '北京·海淀',
    views: 128,
    sellerAvatar: 'https://i.pravatar.cc/150?img=1',
    sellerName: '张同学',
    publishTime: '2小时前',
    status: '热卖',
    category: 'electronics'
  },
  {
    id: 2,
    title: '高等数学教材 第七版 同济大学',
    price: 25,
    originalPrice: 58,
    image: 'https://picsum.photos/400/400?random=2',
    location: '北京·朝阳',
    views: 86,
    sellerAvatar: 'https://i.pravatar.cc/150?img=2',
    sellerName: '李同学',
    publishTime: '5小时前',
    category: 'books'
  },
  {
    id: 3,
    title: '全新羽毛球拍 YONEX 双拍套装',
    price: 299,
    originalPrice: 598,
    image: 'https://picsum.photos/400/400?random=3',
    location: '上海·徐汇',
    views: 234,
    sellerAvatar: 'https://i.pravatar.cc/150?img=3',
    sellerName: '王同学',
    publishTime: '1天前',
    category: 'sports'
  },
  {
    id: 4,
    title: 'MacBook Pro 2021 M1 芯片 16GB 512GB',
    price: 12999,
    originalPrice: 15999,
    image: 'https://picsum.photos/400/400?random=4',
    location: '深圳·南山',
    views: 567,
    sellerAvatar: 'https://i.pravatar.cc/150?img=4',
    sellerName: '刘同学',
    publishTime: '3小时前',
    status: '热卖',
    category: 'electronics'
  },
  {
    id: 5,
    title: 'Nike Air Force 1 白色板鞋 US9码',
    price: 499,
    originalPrice: 799,
    image: 'https://picsum.photos/400/400?random=5',
    location: '杭州·西湖',
    views: 345,
    sellerAvatar: 'https://i.pravatar.cc/150?img=5',
    sellerName: '陈同学',
    publishTime: '6小时前',
    category: 'clothes'
  },
  {
    id: 6,
    title: '索尼降噪耳机 WH-1000XM4 黑色',
    price: 1699,
    originalPrice: 2499,
    image: 'https://picsum.photos/400/400?random=6',
    location: '成都·武侯',
    views: 432,
    sellerAvatar: 'https://i.pravatar.cc/150?img=6',
    sellerName: '赵同学',
    publishTime: '1天前',
    category: 'electronics'
  },
  {
    id: 7,
    title: '英语四级词汇书 新东方乱序版',
    price: 18,
    originalPrice: 38,
    image: 'https://picsum.photos/400/400?random=7',
    location: '武汉·洪山',
    views: 156,
    sellerAvatar: 'https://i.pravatar.cc/150?img=7',
    sellerName: '周同学',
    publishTime: '2天前',
    category: 'books'
  },
  {
    id: 8,
    title: '瑜伽垫加厚10mm 防滑健身垫',
    price: 59,
    originalPrice: 129,
    image: 'https://picsum.photos/400/400?random=8',
    location: '西安·雁塔',
    views: 89,
    sellerAvatar: 'https://i.pravatar.cc/150?img=8',
    sellerName: '吴同学',
    publishTime: '12小时前',
    category: 'sports'
  },
  {
    id: 9,
    title: '小米充电宝 20000mAh 50W快充',
    price: 129,
    originalPrice: 199,
    image: 'https://picsum.photos/400/400?random=9',
    location: '南京·鼓楼',
    views: 278,
    sellerAvatar: 'https://i.pravatar.cc/150?img=9',
    sellerName: '郑同学',
    publishTime: '8小时前',
    category: 'electronics'
  },
  {
    id: 10,
    title: 'Uniqlo 基础款T恤 纯棉多色可选',
    price: 39,
    originalPrice: 79,
    image: 'https://picsum.photos/400/400?random=10',
    location: '重庆·渝中',
    views: 123,
    sellerAvatar: 'https://i.pravatar.cc/150?img=10',
    sellerName: '冯同学',
    publishTime: '1天前',
    category: 'clothes'
  },
])

// 过滤商品
const filteredProducts = computed(() => {
  return products.value
})

// 监听分类切换
watch(currentCategory, () => {
  fetchProducts(true)
})

// 加载更多
function loadMore() {
  fetchProducts(false)
}

// 页面加载时获取数据
onMounted(() => {
  fetchCategories()
  fetchProducts(true)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 固定头部区域 */
.fixed-header {
  position: fixed;
  top: 0;
  left: 240px; /* 侧边栏宽度 */
  right: 20px; /* 右侧边距20px，和消息页一致 */
  z-index: 100;
  background: var(--bg-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-left: 20px; /* 左侧边距20px，和消息页一致 */
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 160px 20px 40px 20px; /* 简化padding，统一左右20px */
  max-width: 100%;
  margin: 0 20px; /* 左右边距都是20px，和消息页一致 */
}

/* 搜索区域 */
.search-section {
  padding: 20px 20px 16px 20px; /* 统一左右padding为20px */
  display: flex;
  justify-content: center;
  background: var(--bg-light);
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-box:hover {
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 36, 66, 0.2);
}

.search-box:focus-within {
  box-shadow: 0 6px 32px rgba(255, 36, 66, 0.2);
  border-color: rgba(255, 36, 66, 0.4);
}

.search-input {
  width: 100%;
  padding: 16px 96px 16px 20px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

/* 搜索按钮 */
.search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 3;
  box-shadow: 0 2px 8px rgba(255, 36, 66, 0.3);
}

.search-btn svg {
  width: 18px;
  height: 18px;
  color: white;
}

.search-btn:hover {
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.5);
}

.search-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* 清除按钮 */
.clear-btn {
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.clear-btn svg {
  width: 14px;
  height: 14px;
  color: var(--text-secondary);
}

.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.clear-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* 分类标签 */
.categories {
  display: flex;
  gap: 16px;
  padding: 8px 20px 16px 20px; /* 统一左右padding为20px */
  overflow-x: auto;
  scrollbar-width: thin;
  justify-content: flex-start; /* 改为左对齐，确保可以滚动 */
  scroll-padding-left: 16px;
  scroll-padding-right: 16px;
  background: var(--bg-light);
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.categories::-webkit-scrollbar {
  height: 4px;
}

.categories::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 32px;
  border: none;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap; /* 防止文字换行 */
  flex-shrink: 0; /* 防止按钮收缩 */
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1.5px solid rgba(0, 0, 0, 0.04);
}

.category-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: rgba(255, 36, 66, 0.2);
}

.category-btn.active {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(255, 36, 66, 0.35);
  border-color: transparent;
  font-weight: 600;
}

.category-btn:active {
  transform: scale(0.98);
}

/* 瀑布流容器 */
.products-grid {
  margin-bottom: 40px;
}

/* 商品网格淡入淡出过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 空状态纯淡入淡出过渡动画 */
.fade-empty-enter-active {
  transition: opacity 0.4s ease;
}

.fade-empty-leave-active {
  transition: opacity 0.25s ease;
}

.fade-empty-enter-from,
.fade-empty-leave-to {
  opacity: 0;
}

.fade-empty-enter-to,
.fade-empty-leave-from {
  opacity: 1;
}

/* 商品网格布局 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

/* 响应式网格 */
@media (min-width: 1536px) {
  .products-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: 1280px) and (max-width: 1535px) {
  .products-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 767px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-bottom: 40px;
}

.load-more-btn {
  padding: 10px 40px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background: var(--bg-white);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.load-more-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.2);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120px 20px;
  color: var(--text-tertiary);
  margin-top: 60px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 20px;
  opacity: 0.4;
  color: #bbb;
}

.empty-icon :deep(svg) {
  width: 72px;
  height: 72px;
  stroke-width: 1.5;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-tertiary);
}

/* 响应式布局 */
/* iPad竖屏：使用手机布局 */
@media (max-width: 1024px) and (orientation: portrait) {
  .fixed-header {
    left: 0; /* 移动端没有侧边栏 */
    margin: 0; /* 移除左右边距 */
    right: 0; /* 占满整个宽度 */
  }

  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 150px 16px 90px 16px; /* 优化顶部padding，确保第一行商品完整显示且留白适中 */
  }

  .categories {
    padding: 8px 16px 16px 16px;
    overflow-x: auto; /* 确保可滚动 */
    justify-content: flex-start; /* 左对齐 */
  }

  .category-btn {
    flex-shrink: 0; /* 防止按钮收缩 */
    white-space: nowrap; /* 防止文字换行 */
  }
}

/* iPad横屏:使用桌面布局 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .fixed-header {
    left: 80px; /* iPad横屏侧边栏缩略宽度 */
    margin-left: 20px; /* 保持20px左边距 */
    right: 20px; /* 保持20px右边距 */
  }

  .main-content {
    padding: 150px 20px 32px 20px;
    margin: 0 20px; /* 保持左右20px边距 */
  }

  .search-section,
  .categories {
    padding-left: 20px;
    padding-right: 20px; /* 确保左右padding一致 */
  }

  .categories {
    overflow-x: auto; /* 确保可滚动 */
    justify-content: flex-start; /* 左对齐 */
  }

  .category-btn {
    flex-shrink: 0; /* 防止按钮收缩 */
    white-space: nowrap; /* 防止文字换行 */
  }
}

/* 手机 */
@media (max-width: 768px) {
  .fixed-header {
    left: 0; /* 移动端没有侧边栏 */
    margin: 0; /* 移除左右边距 */
    right: 0; /* 占满整个宽度 */
  }

  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 150px 12px 90px 12px; /* 优化顶部padding，确保第一行商品完整显示且留白适中，底部留出导航栏空间 */
  }

  .search-section {
    padding: 12px;
  }

  .search-box {
    height: 42px;
  }

  .search-input {
    font-size: 14px;
    padding: 12px 90px 12px 16px;
  }

  .search-btn {
    width: 36px;
    height: 36px;
    right: 8px;
  }

  .search-btn svg {
    width: 16px;
    height: 16px;
  }

  .clear-btn {
    right: 50px;
    width: 26px;
    height: 26px;
  }

  .clear-btn svg {
    width: 12px;
    height: 12px;
  }
  
  .categories {
    gap: 8px;
    padding: 8px 12px 16px 12px;
    overflow-x: auto; /* 恢复横向滚动 */
    justify-content: flex-start;
  }
  
  .category-btn {
    padding: 8px 16px;
    font-size: 13px;
    flex-shrink: 0;
    white-space: nowrap;
    min-height: 36px;
    border-radius: 18px;
  }

  .category-btn:active {
    transform: scale(0.95);
    transition: transform 0.1s;
  }

  .products-grid {
    gap: 10px;
  }

  .empty-state {
    padding: 80px 20px;
    margin-top: 40px;
  }

  .empty-icon {
    font-size: 56px;
  }

  .empty-state p {
    font-size: 15px;
  }

  .load-more-btn {
    font-size: 13px;
    padding: 8px 32px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 150px 8px 90px 8px; /* 优化顶部padding，确保第一行商品完整显示且留白适中 */
  }

  .search-section {
    padding: 8px;
  }

  .search-box {
    height: 40px;
  }

  .search-input {
    font-size: 13px;
  }

  .categories {
    gap: 4px;
    margin-bottom: 12px;
  }

  .category-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .products-grid {
    gap: 8px;
  }
}
</style>
