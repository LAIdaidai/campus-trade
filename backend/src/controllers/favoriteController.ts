import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as FavoriteModel from '../models/favoriteModel';

// 添加收藏
export const addFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;

    if (!userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    if (!productId) {
      res.status(400).json({ error: '缺少商品ID' });
      return;
    }

    // 检查是否已收藏
    const alreadyFavorited = await FavoriteModel.isFavorited(userId, productId);
    if (alreadyFavorited) {
      res.status(400).json({ error: '已经收藏过该商品' });
      return;
    }

    const favoriteId = await FavoriteModel.addFavorite(userId, productId);
    res.status(201).json({ 
      success: true,
      message: '收藏成功',
      favoriteId 
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({ error: '添加收藏失败' });
  }
};

// 取消收藏
export const removeFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const success = await FavoriteModel.removeFavorite(userId, parseInt(productId));
    
    if (success) {
      res.json({ 
        success: true,
        message: '取消收藏成功' 
      });
    } else {
      res.status(404).json({ error: '未找到该收藏记录' });
    }
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({ error: '取消收藏失败' });
  }
};

// 检查是否已收藏
export const checkFavorite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.params;

    if (!userId) {
      res.json({ isFavorited: false });
      return;
    }

    const isFavorited = await FavoriteModel.isFavorited(userId, parseInt(productId));
    res.json({ isFavorited });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({ error: '检查收藏状态失败' });
  }
};

// 获取用户的收藏列表
export const getUserFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const favorites = await FavoriteModel.getUserFavorites(userId);
    res.json({ 
      success: true,
      data: favorites 
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
};

// 获取商品的收藏数
export const getFavoriteCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const count = await FavoriteModel.getFavoriteCount(parseInt(productId));
    res.json({ count });
  } catch (error) {
    console.error('获取收藏数失败:', error);
    res.status(500).json({ error: '获取收藏数失败' });
  }
};
