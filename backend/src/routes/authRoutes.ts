import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { UserController } from '../controllers/userController';

const router = Router();

// 发送验证码
router.post('/send-code', AuthController.sendVerificationCode);

// 验证验证码 (可选)
router.post('/verify-code', AuthController.verifyVerificationCode);

// 重置密码
router.post('/reset-password', AuthController.resetPassword);

// 用户注册
router.post('/register', UserController.register);

export default router;
