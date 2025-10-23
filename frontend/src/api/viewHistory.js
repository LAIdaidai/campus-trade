import request from './request'

// 添加浏览记录
export const addViewHistory = (productId) => {
  return request.post('/view-history', { productId })
}

// 获取浏览历史
export const getViewHistory = (params = {}) => {
  return request.get('/view-history', { params })
}

// 清空浏览历史
export const clearViewHistory = () => {
  return request.delete('/view-history/clear')
}

// 删除单条浏览记录
export const deleteViewHistory = (historyId) => {
  return request.delete(`/view-history/${historyId}`)
}
