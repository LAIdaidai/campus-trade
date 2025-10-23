/**
 * 验证码存储服务 (内存实现)
 * 生产环境建议使用 Redis
 */

interface VerificationCode {
  code: string;
  email: string;
  type: 'register' | 'reset-password';
  createdAt: number;
  expiresAt: number;
}

// 内存存储
const codeStore = new Map<string, VerificationCode>();

// 验证码有效期 (5分钟)
const CODE_EXPIRY_TIME = 5 * 60 * 1000;

// 发送间隔限制 (60秒)
const SEND_INTERVAL = 60 * 1000;

/**
 * 生成6位随机验证码
 */
export const generateCode = (): string => {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
};

/**
 * 生成存储键
 */
const getKey = (email: string, type: string): string => {
  return `${type}:${email.toLowerCase()}`;
};

/**
 * 保存验证码
 */
export const saveCode = (
  email: string,
  code: string,
  type: 'register' | 'reset-password' = 'register'
): boolean => {
  const key = getKey(email, type);
  const now = Date.now();

  // 检查是否在发送间隔内
  const existing = codeStore.get(key);
  if (existing && (now - existing.createdAt) < SEND_INTERVAL) {
    return false; // 发送太频繁
  }

  codeStore.set(key, {
    code,
    email,
    type,
    createdAt: now,
    expiresAt: now + CODE_EXPIRY_TIME
  });

  // 设置自动过期清理
  setTimeout(() => {
    codeStore.delete(key);
  }, CODE_EXPIRY_TIME);

  return true;
};

/**
 * 验证验证码
 */
export const verifyCode = (
  email: string,
  code: string,
  type: 'register' | 'reset-password' = 'register'
): boolean => {
  const key = getKey(email, type);
  const stored = codeStore.get(key);

  if (!stored) {
    return false; // 验证码不存在
  }

  const now = Date.now();
  if (now > stored.expiresAt) {
    codeStore.delete(key);
    return false; // 验证码已过期
  }

  if (stored.code !== code) {
    return false; // 验证码错误
  }

  // 验证成功后删除验证码(一次性使用)
  codeStore.delete(key);
  return true;
};

/**
 * 获取剩余发送冷却时间(秒)
 */
export const getRemainingCooldown = (
  email: string,
  type: 'register' | 'reset-password' = 'register'
): number => {
  const key = getKey(email, type);
  const stored = codeStore.get(key);

  if (!stored) {
    return 0;
  }

  const now = Date.now();
  const elapsed = now - stored.createdAt;
  const remaining = SEND_INTERVAL - elapsed;

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

/**
 * 清理所有过期的验证码
 */
export const cleanExpiredCodes = (): void => {
  const now = Date.now();
  for (const [key, value] of codeStore.entries()) {
    if (now > value.expiresAt) {
      codeStore.delete(key);
    }
  }
};

// 定期清理过期验证码 (每分钟)
setInterval(cleanExpiredCodes, 60 * 1000);
