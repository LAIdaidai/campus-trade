import request from './request'

// 获取所有地址
export const getAddresses = () => {
  return request.get('/addresses')
}

// 获取我的地址（别名）
export const getMyAddresses = getAddresses

// 获取单个地址
export const getAddress = (addressId) => {
  return request.get(`/addresses/${addressId}`)
}

// 创建地址
export const createAddress = (data) => {
  return request.post('/addresses', data)
}

// 更新地址
export const updateAddress = (addressId, data) => {
  return request.put(`/addresses/${addressId}`, data)
}

// 删除地址
export const deleteAddress = (addressId) => {
  return request.delete(`/addresses/${addressId}`)
}

// 设置默认地址
export const setDefaultAddress = (addressId) => {
  return request.patch(`/addresses/${addressId}/default`)
}
