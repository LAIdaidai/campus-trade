import { Request, Response } from 'express';
import * as CategoryModel from '../models/categoryModel';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryModel.getAllCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取类别失败:', error);
    res.status(500).json({
      success: false,
      message: '获取类别失败'
    });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const category = await CategoryModel.getCategoryById(id);
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: '类别不存在'
      });
      return;
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('获取类别详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取类别详情失败'
    });
  }
};
