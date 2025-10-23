import api from './request'

/**
 * 发送验证码
 * @param {Object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.type - 类型: register | reset-password
 */
export const sendVerificationCode = (data) => {
  return api.post('/auth/send-code', data)
}

/**
 * 验证验证码
 * @param {Object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @param {string} data.type - 类型: register | reset-password
 */
export const verifyCode = (data) => {
  return api.post('/auth/verify-code', data)
}

/**
 * 重置密码
 * @param {Object} data
 * @param {string} data.email - 邮箱
 * @param {string} data.code - 验证码
 * @param {string} data.newPassword - 新密码
 */
export const resetPassword = (data) => {
  return api.post('/auth/reset-password', data)
}
