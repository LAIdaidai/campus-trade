import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface ViewHistory {
  id: number;
  user_id: number;
  product_id: number;
  view_time: Date;
}

// 添加浏览记录
export const addViewHistory = async (userId: number, productId: number): Promise<void> => {
  try {
    console.log('📝 尝试添加浏览历史:', { userId, productId });
    
    // 使用 INSERT ... ON DUPLICATE KEY UPDATE 语法
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO view_history (user_id, product_id, view_time) 
       VALUES (?, ?, CURRENT_TIMESTAMP) 
       ON DUPLICATE KEY UPDATE view_time = CURRENT_TIMESTAMP`,
      [userId, productId]
    );
    
    console.log('✅ 浏览历史添加成功:', result);
  } catch (error: any) {
    console.error('❌ 添加浏览历史失败:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    
    // 如果是表不存在的错误，尝试创建表
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('🔧 检测到表不存在，尝试创建...');
      await createViewHistoryTable();
      // 重试插入
      await pool.query<ResultSetHeader>(
        `INSERT INTO view_history (user_id, product_id, view_time) 
         VALUES (?, ?, CURRENT_TIMESTAMP) 
         ON DUPLICATE KEY UPDATE view_time = CURRENT_TIMESTAMP`,
        [userId, productId]
      );
    } else {
      // 其他错误不影响主流程
      console.warn('⚠️ 浏览历史功能暂时不可用');
    }
  }
};

// 创建浏览历史表
const createViewHistoryTable = async (): Promise<void> => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS view_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      view_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_product (user_id, product_id),
      INDEX idx_user_time (user_id, view_time DESC),
      INDEX idx_product (product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await pool.query(createTableSQL);
    console.log('✅ view_history 表创建成功');
  } catch (error) {
    console.error('❌ 创建 view_history 表失败:', error);
    throw error;
  }
};

// 获取用户浏览历史
export const getUserViewHistory = async (
  userId: number, 
  limit: number = 20, 
  offset: number = 0
): Promise<any[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      vh.id,
      vh.view_time,
      p.id as product_id,
      p.title,
      p.price,
      p.images,
      p.status,
      p.seller_id,
      u.username as seller_name,
      u.avatar as seller_avatar,
      p.created_at
    FROM view_history vh
    JOIN products p ON vh.product_id = p.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE vh.user_id = ?
    ORDER BY vh.view_time DESC
    LIMIT ? OFFSET ?
    `,
    [userId, limit, offset]
  );
  
  return rows.map(row => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
  }));
};

// 清空用户浏览历史
export const clearUserViewHistory = async (userId: number): Promise<void> => {
  await pool.query('DELETE FROM view_history WHERE user_id = ?', [userId]);
};

// 删除单条浏览记录
export const deleteViewHistory = async (userId: number, historyId: number): Promise<void> => {
  await pool.query(
    'DELETE FROM view_history WHERE id = ? AND user_id = ?',
    [historyId, userId]
  );
};
