import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as favoriteController from '../controllers/favoriteController';

const router = express.Router();

// 添加收藏 (需要认证)
router.post('/', authenticateToken, favoriteController.addFavorite);

// 取消收藏 (需要认证)
router.delete('/:productId', authenticateToken, favoriteController.removeFavorite);

// 检查是否已收藏
router.get('/check/:productId', authenticateToken, favoriteController.checkFavorite);

// 获取用户的收藏列表 (需要认证)
router.get('/user', authenticateToken, favoriteController.getUserFavorites);

// 获取商品的收藏数 (公开)
router.get('/count/:productId', favoriteController.getFavoriteCount);

export default router;
