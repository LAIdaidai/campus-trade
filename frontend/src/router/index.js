import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import Home from '@/views/Home.vue';
import AuthView from '@/views/AuthView.vue';

const routes = [
    { 
      path: '/', 
      name: 'Home', 
      component: Home,
      meta: { depth: 1 }
    },
    {
      path: '/auth',
      name: 'Auth',
      component: AuthView,
      meta: { depth: 1, public: true }
    },
    {
      path: '/publish',
      name: 'Publish',
      component: () => import('@/views/Publish.vue'),
      meta: { depth: 1, requiresAuth: true }
    },
    {
      path: '/messages',
      name: 'Messages',
      component: () => import('@/views/Messages.vue'),
      meta: { depth: 1, requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: { depth: 1, requiresAuth: true }
    },
    {
      path: '/favorites',
      name: 'Favorites',
      component: () => import('@/views/Favorites.vue'),
      meta: { depth: 1, requiresAuth: true }
    },
    {
      path: '/product/:id',
      name: 'ProductDetail',
      component: () => import('@/views/ProductDetail.vue'),
      meta: { depth: 2 }
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('@/views/Search.vue'),
      meta: { depth: 2 }
    },
    {
      path: '/user/:id',
      name: 'UserHomepage',
      component: () => import('@/views/UserHomepage.vue'),
      meta: { depth: 2 }
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
      // 如果有保存的位置（浏览器前进/后退）
      if (savedPosition) {
        return savedPosition;
      }
      
      // 所有页面切换都滚动到顶部，使用平滑滚动
      return { top: 0, behavior: 'smooth' };
    }
});

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // 检查登录状态：使用store中的isLoggedIn计算属性
  const isAuthenticated = userStore.isLoggedIn;
  
  // 如果目标路由需要认证
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // 未登录,跳转到登录页
      next({ name: 'Auth' });
    } else {
      next();
    }
  } else if (to.name === 'Auth' && isAuthenticated) {
    // 已登录用户访问登录页,跳转到首页
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
