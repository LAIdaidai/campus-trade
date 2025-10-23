import express from 'express';
import * as viewHistoryController from '../controllers/viewHistoryController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 添加浏览记录
router.post('/', viewHistoryController.addViewHistory);

// 获取浏览历史
router.get('/', viewHistoryController.getViewHistory);

// 清空浏览历史
router.delete('/clear', viewHistoryController.clearViewHistory);

// 删除单条浏览记录
router.delete('/:id', viewHistoryController.deleteViewHistory);

export default router;
