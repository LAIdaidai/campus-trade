import express from 'express';
import * as categoryController from '../controllers/categoryController';

const router = express.Router();

// 获取所有类别
router.get('/', categoryController.getCategories);

// 获取单个类别
router.get('/:id', categoryController.getCategoryById);

export default router;
