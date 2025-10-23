import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  // 默认走前端容器的反向代理，Docker生产为 /api
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,  // 增加到30秒，因为邮件发送可能需要较长时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // 处理不同的错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权,清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth'
          }
          break
        case 403:
          console.error('没有权限访问，可能是令牌过期')
          // 403错误通常是令牌过期，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          // 如果当前不在登录页，则跳转
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth'
          }
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error('请求失败:', error.response.data.message)
      }
    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      console.error('请求超时，请检查网络连接或稍后重试')
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络连接失败，请检查后端服务是否启动')
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api
