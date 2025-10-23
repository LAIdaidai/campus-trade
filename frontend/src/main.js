import './assets/main.css'
import './assets/theme.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useUserStore } from './stores/user'
import { lazyLoad } from './directives/lazyLoad'

// 通用字体
const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// 注册全局指令
app.directive('lazy-load', lazyLoad)

// 初始化用户状态 - 如果有 token,尝试获取用户信息
const userStore = useUserStore()
if (userStore.token && !userStore.userInfo) {
  // 有 token 但没有用户信息,尝试获取
  userStore.fetchProfile()
}

app.mount('#app')
