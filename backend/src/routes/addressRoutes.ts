import express from 'express';
import * as addressController from '../controllers/addressController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户所有地址
router.get('/', addressController.getAddresses);

// 获取单个地址
router.get('/:id', addressController.getAddress);

// 创建地址
router.post('/', addressController.createAddress);

// 更新地址
router.put('/:id', addressController.updateAddress);

// 删除地址
router.delete('/:id', addressController.deleteAddress);

// 设置默认地址
router.patch('/:id/default', addressController.setDefaultAddress);

export default router;
