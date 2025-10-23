import express from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import * as uploadController from '../controllers/uploadController';

const router = express.Router();

// 单张图片上传
router.post('/single', uploadSingle, uploadController.uploadSingleImage);

// 多张图片上传 (最多9张)
router.post('/multiple', uploadMultiple, uploadController.uploadMultipleImages);

// 删除图片
router.delete('/delete', uploadController.deleteImage);

export default router;
