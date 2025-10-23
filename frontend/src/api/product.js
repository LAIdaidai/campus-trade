import api from './request'

/**
 * 获取商品列表
 * @param {Object} params - 查询参数
 * @param {string} params.category - 类别筛选
 * @param {string} params.status - 状态筛选 (available/sold/reserved)
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 */
export const getProducts = (params = {}) => {
  return api.get('/products', { params })
}

/**
 * 获取单个商品详情
 */
export const getProductById = (id) => {
  return api.get(`/products/${id}`)
}

/**
 * 创建商品
 */
export const createProduct = (data) => {
  return api.post('/products', data)
}

/**
 * 更新商品状态
 */
export const updateProductStatus = (id, status) => {
  return api.patch(`/products/${id}/status`, { status })
}

/**
 * 编辑商品
 */
export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data)
}

/**
 * 删除商品
 */
export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`)
}

/**
 * 获取我的发布
 */
export const getMyProducts = (params = {}) => {
  return api.get('/products/my/products', { params })
}
