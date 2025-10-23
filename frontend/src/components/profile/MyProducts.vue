<template>
  <div class="my-products">
    <!-- 状态筛选 -->
    <div class="filter-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.value"
        :class="['tab-item', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon icon-box-large"></div>
      <p>{{ emptyText }}</p>
      <button class="btn-publish" @click="$router.push('/publish')">
        去发布商品
      </button>
    </div>

    <!-- 商品列表 -->
    <div v-else class="products-grid">
      <div 
        v-for="product in products" 
        :key="product.id"
        class="product-item"
      >
        <div class="product-image" @click="goToDetail(product.id)">
          <img :src="getImageUrl(product.images[0])" :alt="product.title" />
          <div v-if="product.status === 'sold'" class="sold-badge">已售出</div>
          <!-- 更多操作按钮 -->
          <button 
            class="btn-more" 
            @click.stop="toggleMenu(product.id)"
            :class="{ active: activeMenu === product.id }"
          >
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </button>
          <!-- 操作菜单 -->
          <div 
            v-if="activeMenu === product.id" 
            class="action-menu"
            @click.stop
          >
            <button 
              v-if="product.status === 'available'"
              class="menu-item menu-sold"
              @click="markAsSold(product.id)"
            >
              <span class="icon">✓</span>
              标记已售
            </button>
            <button 
              v-else
              class="menu-item menu-sold"
              @click="markAsAvailable(product.id)"
            >
              <span class="icon">↺</span>
              设为在售
            </button>
            <button 
              class="menu-item menu-edit"
              @click="editProduct(product.id)"
            >
              <span class="icon">✎</span>
              编辑
            </button>
            <button 
              class="menu-item menu-delete"
              @click="confirmDelete(product.id)"
            >
              <span class="icon">✕</span>
              删除
            </button>
          </div>
        </div>
        <div class="product-info">
          <h4 class="product-title" @click="goToDetail(product.id)">{{ product.title }}</h4>
          <p class="product-price">¥{{ product.price }}</p>
          <div class="product-meta">
            <span class="meta-item">{{ formatDate(product.created_at) }}</span>

          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn-load-more" @click="loadMore">
        加载更多
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyProducts, updateProductStatus, deleteProduct } from '@/api/product'
import { getImageUrl } from '@/config'
import toast from '@/utils/toast'
import { showConfirm, showDeleteConfirm } from '@/utils/dialog'

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const products = ref([])
const hasMore = ref(false)
const offset = ref(0)
const limit = 20
const activeMenu = ref(null) // 当前激活的菜单

const tabs = ref([
  { label: '全部', value: 'all', count: undefined },
  { label: '在售', value: 'available', count: undefined },
  { label: '已售', value: 'sold', count: undefined }
])

const emptyText = computed(() => {
  const textMap = {
    all: '还没有发布商品',
    available: '没有在售商品',
    sold: '没有已售商品'
  }
  return textMap[activeTab.value] || '暂无商品'
})

// 获取商品列表
const fetchProducts = async (reset = true) => {
  try {
    loading.value = true
    if (reset) {
      offset.value = 0
    }

    const params = {
      status: activeTab.value === 'all' ? undefined : activeTab.value,
      limit,
      offset: offset.value
    }

    const response = await getMyProducts(params)
    
    if (reset) {
      products.value = response.data || []
    } else {
      products.value = [...products.value, ...(response.data || [])]
    }

    hasMore.value = response.pagination?.hasMore || false
    offset.value += limit
  } catch (error) {
    console.error('获取商品列表失败:', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  fetchProducts(false)
}

// 标记为已售
const markAsSold = async (productId) => {
  const confirmed = await showConfirm({
    title: '标记为已售出',
    message: '确定要标记为已售出吗？',
    type: 'warning',
    confirmText: '标记',
    cancelText: '取消'
  })
  
  if (!confirmed) return

  try {
    await updateProductStatus(productId, 'sold')
    // 刷新列表
    await fetchProducts()
    toast.success('已标记为已售出')
  } catch (error) {
    console.error('标记失败:', error)
    toast.error(error.response?.data?.message || '操作失败')
  }
}

// 设为在售
const markAsAvailable = async (productId) => {
  const confirmed = await showConfirm({
    title: '设为在售',
    message: '确定将该商品设为在售吗？',
    type: 'info',
    confirmText: '设为在售',
    cancelText: '取消'
  })
  if (!confirmed) return
  try {
    await updateProductStatus(productId, 'available')
    await fetchProducts()
    toast.success('已设为在售')
  } catch (error) {
    console.error('设置在售失败:', error)
    toast.error(error.response?.data?.message || '操作失败')
  }
}

// 编辑商品
const editProduct = (productId) => {
  // 简易编辑：跳转发布页带上id；若需要就地弹窗编辑，再加弹窗组件
  router.push({ path: '/publish', query: { id: productId } })
}

// 删除商品
const confirmDelete = async (productId) => {
  const confirmed = await showDeleteConfirm('确定要删除这个商品吗？此操作无法撤销！')
  
  if (!confirmed) return

  try {
    await deleteProduct(productId)
    // 从列表中移除
    products.value = products.value.filter(p => p.id !== productId)
    toast.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    toast.error(error.response?.data?.message || '删除失败')
  }
}

// 切换菜单显示
const toggleMenu = (productId) => {
  activeMenu.value = activeMenu.value === productId ? null : productId
}

// 点击其他地方关闭菜单
const closeMenu = () => {
  activeMenu.value = null
}

// 跳转到详情页
const goToDetail = (productId) => {
  router.push(`/product/${productId}`)
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    available: '在售',
    sold: '已售',
    reserved: '预定'
  }
  return statusMap[status] || status
}

// 监听tab变化
watch(activeTab, () => {
  fetchProducts()
  closeMenu()
})

onMounted(() => {
  fetchProducts()
  // 点击其他地方关闭菜单
  document.addEventListener('click', closeMenu)
})

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<style scoped>
.my-products {
  width: 100%;
}

/* 筛选tabs */
.filter-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-item {
  padding: 12px 24px;
  cursor: pointer;
  position: relative;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-base) var(--ease-in-out);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-item:hover {
  color: var(--primary-color);
}

.tab-item.active {
  color: var(--primary-color);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
}

.tab-count {
  background: var(--bg-dark);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-md);
  font-size: 12px;
}

.tab-item.active .tab-count {
  background: rgba(255, 36, 66, 0.1);
  color: var(--primary-color);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
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

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  opacity: 0.3;
  position: relative;
}

.icon-box-large::before {
  content: '';
  position: absolute;
  width: 60px;
  height: 60px;
  border: 4px solid #999;
  border-radius: var(--radius-sm);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-box-large::after {
  content: '';
  position: absolute;
  width: 30px;
  height: 2px;
  background: #999;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 -12px 0 #999, 0 12px 0 #999;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.btn-publish {
  padding: 12px 32px;
  border-radius: var(--radius-xl);
  border: none;
  background: var(--primary-color);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-publish:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

/* 商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: visible; /* 改为 visible 让菜单可以溢出 */
  cursor: pointer;
  background: #f5f5f5;
  border-radius: 12px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base) var(--ease-in-out);
  border-radius: 12px;
}

.product-image:hover img {
  transform: scale(1.05);
}

.sold-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.product-info {
  padding: 16px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-title:hover {
  color: var(--primary-color);
}

.product-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 12px 0;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.available {
  background: #e8f5e9;
  color: #4caf50;
}

.status-badge.sold {
  background: #ffebee;
  color: #f44336;
}

/* 更多操作按钮 */
.btn-more {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.btn-more:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.btn-more.active {
  background: var(--primary-color);
}

.btn-more .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #666;
  transition: background 0.3s;
}

.btn-more.active .dot {
  background: #fff;
}

/* 操作菜单 */
.action-menu {
  position: absolute;
  top: 50px;
  right: 12px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
  min-width: 140px;
  animation: menuSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
}

.menu-item .icon {
  font-size: 16px;
  font-weight: bold;
  width: 20px;
  text-align: center;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.menu-sold {
  color: #4caf50;
}

.menu-sold:hover {
  background: rgba(76, 175, 80, 0.08);
}

.btn-sold:hover {
  background: #4caf50;
  color: #fff;
}

.btn-edit {
  background: #e3f2fd;
  color: #2196f3;
}

.btn-edit:hover {
  background: #2196f3;
  color: #fff;
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-top: 32px;
}

.btn-load-more {
  padding: 12px 40px;
  border-radius: 20px;
  border: 2px solid var(--primary-color);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-load-more:hover {
  background: var(--primary-color);
  color: #fff;
}

/* iPad mini - iPad Pro：统一3列网格 */
@media (min-width: 769px) and (max-width: 1366px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .product-info {
    padding: 12px;
  }

  .product-title {
    font-size: 14px;
  }

  .product-price {
    font-size: 18px;
  }

  .product-meta {
    font-size: 12px;
  }
}

/* 移动端：3列网格 */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  /* 缩小商品信息字体 */
  .product-info {
    padding: 8px;
  }

  .product-title {
    font-size: 12px;
    margin: 0 0 4px 0;
  }

  .product-price {
    font-size: 14px;
    margin: 0 0 6px 0;
  }

  .product-meta {
    font-size: 10px;
  }

  .status-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .sold-badge {
    font-size: 10px;
    padding: 3px 8px;
    top: 6px;
    left: 6px;
  }

  .btn-more {
    width: 24px;
    height: 24px;
    top: 6px;
    right: 6px;
  }

  .btn-more .dot {
    width: 2.5px;
    height: 2.5px;
    gap: 2px;
  }

  .action-menu {
    top: 36px;
    right: 6px;
    min-width: 100px;
  }

  .menu-item {
    padding: 8px 10px;
    font-size: 11px;
    gap: 6px;
  }

  .menu-item .icon {
    font-size: 12px;
    width: 16px;
  }
}
</style>
