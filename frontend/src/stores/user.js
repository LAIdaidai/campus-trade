import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as userApi from '@/api/user'
import { isTokenExpired, clearAuthData } from '@/utils/token'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复状态
  const getStoredUserInfo = () => {
    try {
      const stored = localStorage.getItem('userInfo')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('解析用户信息失败:', error)
      return null
    }
  }

  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(getStoredUserInfo())
  const loading = ref(false)

  // 检查令牌是否有效
  const isTokenValid = () => {
    if (!token.value) return false
    return !isTokenExpired(token.value)
  }

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value && isTokenValid())

  // 设置 token
  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  // 设置用户信息
  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  // 注册
  const register = async (data) => {
    loading.value = true
    try {
      const response = await userApi.register(data)
      
      // 同步保存 token 和用户信息
      token.value = response.token
      userInfo.value = response.user
      
      // 保存到 localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('userInfo', JSON.stringify(response.user))
      
      return { success: true, message: response.message }
    } catch (error) {
      console.error('注册失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '注册失败，请稍后重试' 
      }
    } finally {
      loading.value = false
    }
  }

  // 登录
  const login = async (data) => {
    loading.value = true
    try {
      const response = await userApi.login(data)
      
      // 同步保存 token 和用户信息
      token.value = response.token
      userInfo.value = response.user
      
      // 保存到 localStorage
      localStorage.setItem('token', response.token)
      localStorage.setItem('userInfo', JSON.stringify(response.user))
      
      return { success: true, message: response.message }
    } catch (error) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '登录失败,请检查账号密码' 
      }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    clearAuthData()
    token.value = ''
    userInfo.value = null
    // 跳转由调用者处理,不在store中直接操作路由
  }

  // 获取用户信息
  const fetchProfile = async () => {
    if (!token.value) return

    try {
      const response = await userApi.getProfile()
      setUserInfo(response.user)
      return { success: true, user: response.user }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果 token 失效，清除登录状态
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
        return { success: false, error: 'TOKEN_EXPIRED' }
      }
      return { success: false, error: 'NETWORK_ERROR' }
    }
  }

  // 验证用户状态（页面刷新时调用）
  const validateUser = async () => {
    // 如果没有token，直接返回未登录
    if (!token.value) {
      return { success: false, error: 'NO_TOKEN' }
    }

    // 如果token已过期，清除状态
    if (!isTokenValid()) {
      logout()
      return { success: false, error: 'TOKEN_EXPIRED' }
    }

    // 如果有用户信息，直接返回成功
    if (userInfo.value) {
      return { success: true, user: userInfo.value }
    }

    // 尝试获取用户信息
    try {
      const result = await fetchProfile()
      return result
    } catch (error) {
      console.error('验证用户失败:', error)
      logout()
      return { success: false, error: 'VALIDATION_FAILED' }
    }
  }

  // 更新用户信息
  const updateProfile = async (data) => {
    try {
      loading.value = true
      const response = await userApi.updateProfile(data)
      setUserInfo(response.user)
      return { success: true, message: response.message }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '更新失败，请稍后重试' 
      }
    } finally {
      loading.value = false
    }
  }

  return {
    token,
    userInfo,
    loading,
    isLoggedIn,
    register,
    login,
    logout,
    fetchProfile,
    updateProfile,
    validateUser
  }
})
