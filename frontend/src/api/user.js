import api from './request'

/**
 * 用户注册
 * @param {Object} data - 注册信息
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @param {string} data.password - 密码
 */
export const register = (data) => {
  return api.post('/users/register', data)
}

/**
 * 用户登录
 * @param {Object} data - 登录信息
 * @param {string} data.loginId - 邮箱或用户名
 * @param {string} data.password - 密码
 */
export const login = (data) => {
  return api.post('/users/login', data)
}

/**
 * 获取当前用户信息
 */
export const getProfile = () => {
  return api.get('/users/profile')
}

/**
 * 更新用户信息
 * @param {Object} data - 更新信息
 * @param {string} data.username - 用户名
 * @param {string} data.email - 邮箱
 * @param {string} data.phone - 手机号
 * @param {string} data.avatar - 头像
 */
export const updateProfile = (data) => {
  return api.put('/users/profile', data)
}

/**
 * 修改密码
 * @param {Object} data - 密码信息
 * @param {string} data.current_password - 当前密码
 * @param {string} data.new_password - 新密码
 */
export const changePassword = (data) => {
  return api.put('/users/profile/password', data)
}

/**
 * 获取所有用户列表 (管理员)
 */
export const getAllUsers = () => {
  return api.get('/users')
}

/**
 * 根据ID获取用户信息
 * @param {number} userId - 用户ID
 */
export const getUserById = (userId) => {
  return api.get(`/users/${userId}`)
}