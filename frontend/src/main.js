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

// 初始化用户状态 - 验证用户登录状态
const userStore = useUserStore()
if (userStore.token) {
  // 有 token，验证用户状态
  userStore.validateUser().then(result => {
    if (!result.success) {
      console.log('应用启动时用户验证失败:', result.error)
      // 验证失败，清除无效数据
      userStore.logout()
    }
  }).catch(error => {
    console.error('用户验证过程中出错:', error)
    userStore.logout()
  })
}

app.mount('#app')
