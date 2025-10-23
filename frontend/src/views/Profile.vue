<template>
  <div class="page">
    <div class="profile-container">
      <!-- 左侧用户信息和菜单 -->
      <aside class="profile-sidebar">
        <!-- 用户信息卡片 -->
        <div class="user-card">
          <img :src="userAvatar" :alt="userStore.userInfo?.username" class="user-avatar" />
          <div class="user-info">
            <h2 class="username">{{ userStore.userInfo?.username || '用户' }}</h2>
            <p class="user-email">{{ userStore.userInfo?.email }}</p>
          </div>
        </div>

        <!-- 菜单 -->
        <nav class="profile-menu">
          <div 
            v-for="item in menuItems" 
            :key="item.key"
            :class="['menu-item', { active: activeMenu === item.key, 'logout-item': item.isAction }]"
            @click="item.isAction ? handleLogout() : (activeMenu = item.key)"
          >
            <span :class="['menu-icon', `icon-${item.icon}`]"></span>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="item.count !== undefined" class="menu-badge">{{ item.count }}</span>
          </div>
        </nav>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="profile-content">
        <!-- 我的发布 -->
        <div v-if="activeMenu === 'myProducts'" class="content-section">
          <h3 class="section-title">我的发布</h3>
          <MyProducts />
        </div>

        <!-- 我的订单 -->
        <div v-else-if="activeMenu === 'orders'" class="content-section">
          <h3 class="section-title">我的订单</h3>
          <MyOrders :default-tab="(route.query.tab && String(route.query.tab) === 'sold') ? 'sold' : 'bought'" />
        </div>

        <!-- 浏览历史 -->
        <div v-else-if="activeMenu === 'history'" class="content-section">
          <h3 class="section-title">浏览历史</h3>
          <ViewHistory />
        </div>

        <!-- 地址管理 -->
        <div v-else-if="activeMenu === 'addresses'" class="content-section">
          <h3 class="section-title">地址管理</h3>
          <AddressManagement />
        </div>

        <!-- 个人资料 -->
        <div v-else-if="activeMenu === 'profile'" class="content-section">
          <h3 class="section-title">个人资料</h3>
          <UserProfile />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getImageUrl } from '@/config'
import { showLogoutConfirm } from '@/utils/dialog'
import MyProducts from '@/components/profile/MyProducts.vue'
import ViewHistory from '@/components/profile/ViewHistory.vue'
import AddressManagement from '@/components/profile/AddressManagement.vue'
import UserProfile from '@/components/profile/UserProfile.vue'
import MyOrders from '@/components/profile/MyOrders.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const activeMenu = ref(route.query.menu ? String(route.query.menu) : 'myProducts')

// 退出登录
const handleLogout = async () => {
  const confirmed = await showLogoutConfirm('确定要退出登录吗？')
  if (confirmed) {
    userStore.logout()
    router.push('/auth')
  }
}

const menuItems = ref([
  { key: 'myProducts', label: '我的发布', icon: 'box', count: undefined },
  { key: 'orders', label: '我的订单', icon: 'shopping-bag', count: undefined },
  { key: 'history', label: '浏览历史', icon: 'eye', count: undefined },
  { key: 'addresses', label: '地址管理', icon: 'map-pin', count: undefined },
  { key: 'profile', label: '个人资料', icon: 'settings', count: undefined },
  { key: 'logout', label: '退出登录', icon: 'logout', count: undefined, isAction: true }
])

const userAvatar = computed(() => {
  if (userStore.userInfo?.avatar) {
    const avatarUrl = getImageUrl(userStore.userInfo.avatar)
    console.log('Profile 页面头像:', {
      原始路径: userStore.userInfo.avatar,
      转换后URL: avatarUrl
    })
    return avatarUrl
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userStore.userInfo?.username || '用户')}&background=ff2442&color=fff&size=200`
})

onMounted(() => {
  // 可以在这里获取各个菜单项的数量
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-gray);
  display: flex;
  overflow: hidden; /* 防止页面滚动 */
}

.profile-container {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  margin: 0 20px 0 20px; /* 左右边距都是20px，和消息页一致 */
  padding: 40px 20px;
  height: 100vh; /* 占满视口高度 */
  overflow: hidden; /* 防止容器滚动 */
}

/* 左侧边栏 - 完全固定 */
.profile-sidebar {
  width: 360px; /* 增加宽度，确保信息完整显示 */
  flex-shrink: 0;
  height: calc(100vh - 80px); /* 占满高度减去padding */
  overflow-y: auto; /* 侧边栏内容可滚动 */
  scrollbar-width: thin; /* Firefox 细滚动条 */
}

/* 侧边栏滚动条样式 */
.profile-sidebar::-webkit-scrollbar {
  width: 6px;
}

.profile-sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.profile-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 右侧内容区域 - 独立滚动 */
.profile-content {
  flex: 1;
  min-width: 0;
  height: calc(100vh - 80px); /* 占满高度减去padding */
  overflow-y: auto; /* 右侧内容独立滚动 */
  padding-right: 10px; /* 给滚动条留空间 */
}

/* 右侧内容滚动条样式 */
.profile-content::-webkit-scrollbar {
  width: 8px;
}

.profile-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.profile-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 用户信息卡片 - 小红书风格 */
.user-card {
  background: linear-gradient(135deg, #f76477 0%, #f56363 100%);
  border-radius: 20px;
  padding: 36px 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  box-shadow: 0 8px 32px rgba(255, 36, 66, 0.25);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.user-info {
  flex: 1;
  color: #fff;
  position: relative;
  z-index: 1;
}

.username {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-break: break-word; /* 长用户名自动换行 */
}

.user-email {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
  word-break: break-all; /* 邮箱自动换行 */
}

/* 菜单 - 垂直列表布局 */
.profile-menu {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-top: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin-bottom: 4px;
}

.menu-item:last-child {
  margin-bottom: 0;
}

.menu-item:hover {
  background: rgba(255, 36, 66, 0.05);
  transform: translateX(4px);
}

.menu-item.active {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.3);
  transform: translateX(0);
}

.menu-icon {
  width: 20px;
  height: 20px;
  display: inline-block;
  position: relative;
  flex-shrink: 0;
}

/* 图标样式 */
.icon-box::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 3px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-shopping-bag::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 16px;
  border: 2px solid currentColor;
  border-top: none;
  border-radius: 0 0 3px 3px;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
}

.icon-shopping-bag::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 6px;
  border: 2px solid currentColor;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.icon-dollar::before {
  content: '$';
  position: absolute;
  font-size: 18px;
  font-weight: 600;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-eye::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-eye::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-map-pin::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  top: 2px;
  left: 50%;
  margin-left: -6px;
}

.icon-map-pin::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  top: 5px;
  left: 50%;
  margin-left: -2px;
}

.icon-settings::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-settings::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.icon-logout::before {
  content: '';
  position: absolute;
  width: 14px;
  height: 16px;
  border: 2px solid currentColor;
  border-left: none;
  border-radius: 0 4px 4px 0;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
}

.icon-logout::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 2px;
  background: currentColor;
  top: 50%;
  left: 50%;
  transform: translate(-120%, -50%);
  box-shadow: 
    3px -3px 0 0 currentColor,
    3px 3px 0 0 currentColor;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  width: 6px;
  height: 6px;
  background: transparent;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: translate(-120%, -50%) rotate(45deg);
  box-shadow: none;
}

.menu-item.logout-item {
  color: #ff4d4f;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 8px;
  padding-top: 20px;
}

.menu-item.logout-item:hover {
  background: rgba(255, 77, 79, 0.08);
  color: #ff4d4f;
}

.menu-label {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
}

.menu-badge {
  background: rgba(255, 36, 66, 0.1);
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}

.menu-item.active .menu-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 右侧内容 */
.profile-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* 内容区域 */
.content-section {
  background: transparent;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

/* 空状态 */
.empty-placeholder {
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

/* 大图标样式 */
.icon-shopping-bag-large::before {
  content: '';
  position: absolute;
  width: 50px;
  height: 60px;
  border: 4px solid #999;
  border-top: none;
  border-radius: 0 0 8px 8px;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.icon-shopping-bag-large::after {
  content: '';
  position: absolute;
  width: 36px;
  height: 16px;
  border: 4px solid #999;
  border-bottom: none;
  border-radius: 18px 18px 0 0;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.icon-dollar-large::before {
  content: '$';
  position: absolute;
  font-size: 72px;
  font-weight: 700;
  color: var(--text-tertiary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-placeholder p {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.empty-placeholder small {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 响应式 */
/* 小尺寸桌面/平板 (如iPad mini) */
@media (min-width: 769px) and (max-width: 1280px) {
  .profile-sidebar {
    width: 280px; /* 减小宽度，适配iPad mini等小屏设备 */
  }

  /* 优化用户卡片，避免换行 */
  .user-card {
    padding: 24px 20px; /* 减小内边距 */
    gap: 16px; /* 减小间距 */
  }

  .user-avatar {
    width: 70px; /* 减小头像 */
    height: 70px;
    border-width: 3px; /* 减小边框 */
  }

  .username {
    font-size: 22px; /* 减小字体 */
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .user-email {
    font-size: 13px; /* 减小邮箱字体 */
    line-height: 1.4;
  }
}

/* iPad 横屏:保持桌面布局 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .profile-container {
    margin: 0 20px; /* 保持统一的左右20px边距 */
    padding: 32px 20px; /* 简化padding */
  }

  .profile-sidebar {
    width: 280px; /* iPad横屏使用较小宽度 */
    top: 32px; /* 调整固定位置 */
  }

  /* 优化用户卡片，避免换行 */
  .user-card {
    padding: 24px 20px;
    gap: 16px;
  }

  .user-avatar {
    width: 70px;
    height: 70px;
    border-width: 3px;
  }

  .username {
    font-size: 22px;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .user-email {
    font-size: 13px;
    line-height: 1.4;
  }
}

/* iPad 竖屏和移动端:改为单列布局 */
@media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
  .page {
    padding-left: 0; /* 没有侧边栏 */
    padding-bottom: 80px; /* 留出底部导航栏空间 */
    overflow: visible !important; /* 允许正常滚动 */
    display: block !important; /* 改为block布局 */
    min-height: auto; /* 移除最小高度限制 */
  }

  .profile-container {
    flex-direction: column;
    margin: 0; /* 移除左右边距 */
    padding: 20px 16px;
    display: block !important; /* 改为block布局 */
    height: auto !important; /* 移除固定高度 */
    overflow: visible !important; /* 允许正常滚动 */
  }

  .profile-sidebar {
    width: 100%;
    position: static; /* 移动端取消固定 */
    height: auto !important; /* 移除固定高度 */
    overflow-y: visible !important; /* 允许正常滚动 */
    margin-bottom: 20px; /* 添加底部间距 */
  }

  .profile-content {
    height: auto !important; /* 移除固定高度 */
    overflow-y: visible !important; /* 允许正常滚动 */
    padding-right: 0; /* 移除右侧padding */
  }

  .user-card {
    padding: 24px 20px;
  }

  .profile-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .menu-item {
    flex-direction: column;
    text-align: center;
    padding: 10px;
    margin-bottom: 0;
  }

  .menu-label {
    font-size: 13px;
  }
}

/* 手机端额外优化 */
@media (max-width: 640px) {

  .user-card {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
  }

  .username {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .user-email {
    font-size: 13px;
  }

  .menu-icon {
    font-size: 20px;
    margin-bottom: 4px;
  }

  .menu-label {
    font-size: 12px;
  }

  .menu-badge {
    top: 6px;
    right: 6px;
    min-width: 16px;
    height: 16px;
    font-size: 10px;
    padding: 0 4px;
  }

  .section-title {
    font-size: 18px;
    margin-bottom: 16px;
  }
}
</style>
