import api from './request'

// 添加收藏
export const addFavorite = async (productId) => {
  return api.post('/favorites', { productId })
}

// 取消收藏
export const removeFavorite = async (productId) => {
  return api.delete(`/favorites/${productId}`)
}

// 检查是否已收藏
export const checkFavorite = async (productId) => {
  return api.get(`/favorites/check/${productId}`)
}

// 获取用户的收藏列表
export const getUserFavorites = async () => {
  return api.get('/favorites/user')
}

// 获取商品的收藏数
export const getFavoriteCount = async (productId) => {
  return api.get(`/favorites/count/${productId}`)
}
