import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const productImagesDir = path.join(uploadDir, 'products');
const avatarDir = path.join(uploadDir, 'avatars');

// 创建目录
[uploadDir, productImagesDir, avatarDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据上传类型决定存储位置
    const uploadType = req.body.uploadType || 'products';
    const destPath = (uploadType === 'avatar' || uploadType === 'avatars') ? avatarDir : productImagesDir;
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名: 时间戳-随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器 - 只允许图片
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的MIME类型
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // 允许的文件扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // 获取文件扩展名（转为小写）
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 同时验证MIME类型和文件扩展名
  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('只支持上传图片文件 (jpg, jpeg, png, gif, webp)'));
  }
};

// 创建 multer 实例
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制10MB
  }
});

// 计算文件MD5哈希值
export const calculateFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

// 根据哈希值查找已存在的文件
export const findExistingFile = (hash: string, uploadType: string = 'products'): string | null => {
  const targetDir = (uploadType === 'avatar' || uploadType === 'avatars') ? avatarDir : productImagesDir;
  
  if (!fs.existsSync(targetDir)) {
    return null;
  }
  
  const files = fs.readdirSync(targetDir);
  
  for (const file of files) {
    const filePath = path.join(targetDir, file);
    
    // 检查文件名中是否包含哈希值(我们将采用新的命名规则)
    if (file.includes(hash)) {
      return file;
    }
  }
  
  return null;
};

// 单文件上传中间件
export const uploadSingle = upload.single('image');

// 多文件上传中间件 (最多9张)
export const uploadMultiple = upload.array('images', 9);
