import api from './request'

/**
 * 上传单张图片
 * @param {File} file - 图片文件
 * @param {string} uploadType - 上传类型 (products/avatars)
 */
export const uploadSingleImage = (file, uploadType = 'products') => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('uploadType', uploadType)
  
  return api.post('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传多张图片
 * @param {File[]} files - 图片文件数组
 * @param {string} uploadType - 上传类型 (products/avatars)
 */
export const uploadMultipleImages = (files, uploadType = 'products') => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('images', file)
  })
  formData.append('uploadType', uploadType)
  
  return api.post('/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除图片
 * @param {string} filename - 文件名
 * @param {string} uploadType - 上传类型 (products/avatars)
 */
export const deleteImage = (filename, uploadType = 'products') => {
  return api.delete('/upload/delete', {
    data: { filename, uploadType }
  })
}
