<template>
  <aside :class="['sidebar', { 'mobile': isMobile }]">
    <!-- Logo (桌面端) -->
    <div v-if="!isMobile" class="sidebar-logo">
      <div class="logo-icon" aria-label="校园交易">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 24L32 12L56 24L32 36L8 24Z" fill="#ff2442"/>
          <path d="M16 28V42C16 45.314 18.6863 48 22 48H42C45.3137 48 48 45.314 48 42V28L32 36L16 28Z" fill="#FF6B6B"/>
          <rect x="28" y="36" width="8" height="16" rx="2" fill="#ffffff"/>
        </svg>
      </div>
      <span class="logo-text">校园交易</span>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ 'navigating': isNavigating }" @click="handleNavClick">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span class="nav-text">首页</span>
      </router-link>

      <router-link to="/publish" class="nav-item" :class="{ 'navigating': isNavigating }" @click="handleNavClick">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span class="nav-text">发布</span>
      </router-link>

      <router-link to="/messages" class="nav-item" :class="{ 'navigating': isNavigating }" @click="handleNavClick">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="nav-text">消息</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </router-link>

      <router-link to="/favorites" class="nav-item" :class="{ 'navigating': isNavigating }" @click="handleNavClick">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span class="nav-text">收藏</span>
      </router-link>

      <router-link to="/profile" class="nav-item" :class="{ 'navigating': isNavigating }" @click="handleNavClick">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="nav-text">我的</span>
      </router-link>
    </nav>

    <!-- 用户信息 (桌面端) -->
    <div v-if="!isMobile" class="sidebar-user">
      <div v-if="userStore.isLoggedIn" class="user-info">
        <img :src="userAvatar" alt="头像" class="user-avatar" />
        <div class="user-details">
          <div class="user-name">{{ userStore.userInfo?.username }}</div>
          <button @click="logout" class="btn-logout">退出</button>
        </div>
      </div>
      <router-link v-else to="/auth" class="btn-login">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        登录 / 注册
      </router-link>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import socketService from '@/utils/socket'
import { getUnreadCount } from '@/api/message'
import { getImageUrl } from '@/config'

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const userStore = useUserStore()

const unreadCount = ref(0)
const isNavigating = ref(false)

// 计算用户头像URL
const userAvatar = computed(() => {
  if (userStore.userInfo?.avatar) {
    const avatarUrl = getImageUrl(userStore.userInfo.avatar)
    console.log('侧边栏头像URL:', { original: userStore.userInfo.avatar, generated: avatarUrl })
    return avatarUrl
  }
  // 使用 ui-avatars 生成默认头像
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(userStore.userInfo?.username || '用户')}&background=ff2442&color=fff&size=150`
})

// 获取未读消息数
const fetchUnreadCount = async () => {
  if (!userStore.isLoggedIn) return
  
  try {
    const response = await getUnreadCount()
    unreadCount.value = response.data?.count || 0
  } catch (error) {
    console.error('获取未读消息数失败:', error)
  }
}

// 监听未读消息更新
const handleUnreadCountUpdate = (data) => {
  console.log('📬 收到未读消息更新:', data)
  unreadCount.value = data.count || 0
}

// 监听新消息
const handleNewMessage = (data) => {
  console.log('💬 收到新消息通知:', data)
  // 增加未读数
  unreadCount.value = (unreadCount.value || 0) + 1
}

const logout = () => {
  userStore.logout()
  router.push('/')
}

// 处理导航点击
const handleNavClick = (event) => {
  // 防止重复点击
  if (isNavigating.value) {
    event.preventDefault()
    return
  }
  
  isNavigating.value = true
  
  // 短暂延迟后重置状态
  setTimeout(() => {
    isNavigating.value = false
  }, 300)
}

// 监听登录状态变化
watch(() => userStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchUnreadCount()
    // 连接WebSocket
    const token = localStorage.getItem('token')
    if (token && !socketService.socket?.connected) {
      socketService.connect(token)
    }
  } else {
    unreadCount.value = 0
  }
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchUnreadCount()
    
    // 注册WebSocket事件监听
    socketService.on('unread_count_updated', handleUnreadCountUpdate)
    socketService.on('new_message', handleNewMessage)
  }
})

onUnmounted(() => {
  // 清理事件监听
  socketService.off('unread_count_updated', handleUnreadCountUpdate)
  socketService.off('new_message', handleNewMessage)
})
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-bottom: 1px solid rgba(255, 36, 66, 0.08);
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.nav-item:hover {
  background: rgba(255, 36, 66, 0.05);
  color: var(--primary-color);
  transform: translateX(4px);
}

.nav-item:active {
  transform: translateX(2px) scale(0.98);
  transition: all 0.1s ease;
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(255, 36, 66, 0.1) 0%, rgba(255, 36, 66, 0.05) 100%);
  color: var(--primary-color);
  border-right: 3px solid var(--primary-color);
  font-weight: 600;
  transform: translateX(0);
}

.nav-item.navigating {
  opacity: 0.7;
  pointer-events: none;
  transform: scale(0.98);
}

.nav-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
}

.badge {
  padding: 2px 8px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

/* 用户信息 */
.sidebar-user {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-logout {
  margin-top: 4px;
  padding: 4px 12px;
  background: var(--bg-dark);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-logout:hover {
  background: #e0e0e0;
}

.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 20px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-login svg {
  width: 18px;
  height: 18px;
}

.btn-login:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

/* 响应式 */
/* iPad竖屏：手机模式（在mobile类下通过另一个媒体查询处理） */

/* iPad横屏：桌面模式（缩略显示，只显示图标） */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .sidebar {
    width: 80px;
  }

  .logo-text {
    display: none;
  }

  .sidebar-logo {
    justify-content: center;
    padding: 24px 12px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .nav-text {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 16px 12px;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-item:hover {
    background: rgba(255, 36, 66, 0.05);
    transform: scale(1.05);
  }

  .nav-item:active {
    transform: scale(0.95);
    transition: all 0.1s ease;
  }

  .nav-item.router-link-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 32px;
    background: var(--primary-color);
    border-radius: 0 4px 4px 0;
  }

  .badge {
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    line-height: 18px;
  }

  .user-details {
    display: none;
  }

  .user-info {
    justify-content: center;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }

  .btn-login {
    padding: 10px;
    font-size: 13px;
    gap: 6px;
  }

  .btn-login svg {
    width: 16px;
    height: 16px;
  }
}

/* iPad竖屏 + 手机：底部导航栏 */
@media (max-width: 1024px) and (orientation: portrait),
       (max-width: 768px) {
  .sidebar.mobile {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: 100%;
    height: auto;
    border-right: none;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    flex-direction: row;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
  }

  .sidebar.mobile .sidebar-nav {
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 0;
    overflow-y: visible;
  }

  .sidebar.mobile .nav-item {
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 10px 8px;
    font-size: 11px;
    border-right: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .sidebar.mobile .nav-item:hover {
    background: rgba(255, 36, 66, 0.05);
    transform: translateY(-2px);
  }

  .sidebar.mobile .nav-item:active {
    transform: translateY(0) scale(0.95);
    transition: all 0.1s ease;
  }

  .sidebar.mobile .nav-item.router-link-active {
    background: transparent;
    border-right: none;
    border-top: none;
    border-bottom: 3px solid var(--primary-color);
    color: var(--primary-color);
    transform: translateY(0);
  }

  .sidebar.mobile .nav-icon {
    width: 22px;
    height: 22px;
  }

  .sidebar.mobile .nav-text {
    display: block !important;
    font-size: 11px;
  }

  .sidebar.mobile .badge {
    position: absolute;
    top: 6px;
    right: 50%;
    transform: translateX(12px);
    padding: 1px 5px;
    font-size: 10px;
    min-width: 16px;
    height: 16px;
    line-height: 14px;
  }
}
</style>
