import api from './request'

/**
 * 获取所有类别
 */
export const getCategories = () => {
  return api.get('/categories')
}

/**
 * 获取单个类别详情
 */
export const getCategoryById = (id) => {
  return api.get(`/categories/${id}`)
}
