/**
 * JWT令牌处理工具
 */

/**
 * 解析JWT令牌
 * @param {string} token - JWT令牌
 * @returns {object|null} 解析后的令牌内容
 */
export const parseToken = (token) => {
  if (!token) return null
  
  try {
    // JWT令牌由三部分组成，用.分隔
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // 解码payload部分（第二部分）
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (error) {
    console.error('解析令牌失败:', error)
    return null
  }
}

/**
 * 检查令牌是否过期
 * @param {string} token - JWT令牌
 * @returns {boolean} 是否过期
 */
export const isTokenExpired = (token) => {
  const decoded = parseToken(token)
  if (!decoded || !decoded.exp) return true
  
  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}

/**
 * 检查令牌是否即将过期（在指定时间内过期）
 * @param {string} token - JWT令牌
 * @param {number} minutes - 提前多少分钟检查（默认30分钟）
 * @returns {boolean} 是否即将过期
 */
export const isTokenExpiringSoon = (token, minutes = 30) => {
  const decoded = parseToken(token)
  if (!decoded || !decoded.exp) return true
  
  const currentTime = Math.floor(Date.now() / 1000)
  const expirationTime = decoded.exp
  const warningTime = minutes * 60 // 转换为秒
  
  return (expirationTime - currentTime) < warningTime
}

/**
 * 获取令牌剩余时间（秒）
 * @param {string} token - JWT令牌
 * @returns {number} 剩余时间（秒），-1表示已过期或无效
 */
export const getTokenRemainingTime = (token) => {
  const decoded = parseToken(token)
  if (!decoded || !decoded.exp) return -1
  
  const currentTime = Math.floor(Date.now() / 1000)
  const remaining = decoded.exp - currentTime
  
  return remaining > 0 ? remaining : -1
}

/**
 * 清除所有认证相关的本地存储
 */
export const clearAuthData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('userInfo')
}

/**
 * 检查并处理过期的令牌
 * @returns {boolean} 是否已清除过期令牌
 */
export const checkAndClearExpiredToken = () => {
  const token = localStorage.getItem('token')
  
  if (!token) return false
  
  if (isTokenExpired(token)) {
    console.log('检测到过期令牌，正在清除...')
    clearAuthData()
    return true
  }
  
  return false
}

/**
 * 定期检查令牌状态
 * @param {Function} onTokenExpired - 令牌过期时的回调函数
 * @param {number} intervalMinutes - 检查间隔（分钟）
 */
export const startTokenMonitor = (onTokenExpired, intervalMinutes = 5) => {
  const intervalMs = intervalMinutes * 60 * 1000
  
  const checkToken = () => {
    const token = localStorage.getItem('token')
    
    if (!token) return
    
    if (isTokenExpired(token)) {
      console.log('定期检查发现过期令牌')
      clearAuthData()
      if (typeof onTokenExpired === 'function') {
        onTokenExpired()
      }
    } else if (isTokenExpiringSoon(token, 30)) {
      console.warn('令牌即将过期，建议刷新')
    }
  }
  
  // 立即检查一次
  checkToken()
  
  // 设置定期检查
  return setInterval(checkToken, intervalMs)
}
