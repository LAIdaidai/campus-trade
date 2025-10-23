import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  created_at: Date;
}

// 添加收藏
export const addFavorite = async (userId: number, productId: number): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );
  return result.insertId;
};

// 取消收藏
export const removeFavorite = async (userId: number, productId: number): Promise<boolean> => {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return result.affectedRows > 0;
};

// 检查是否已收藏
export const isFavorited = async (userId: number, productId: number): Promise<boolean> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return rows.length > 0;
};

// 获取用户的收藏列表
export const getUserFavorites = async (userId: number): Promise<any[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      p.*,
      u.username as seller_name,
      u.avatar as seller_avatar,
      f.created_at as favorited_at,
      COALESCE(COUNT(DISTINCT f2.id), 0) as favorite_count
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    LEFT JOIN users u ON p.seller_id = u.id
    LEFT JOIN favorites f2 ON p.id = f2.product_id
    WHERE f.user_id = ?
    GROUP BY p.id, f.created_at
    ORDER BY f.created_at DESC
    `,
    [userId]
  );
  
  return rows.map(row => ({
    ...row,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
  }));
};

// 获取商品的收藏数量
export const getFavoriteCount = async (productId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM favorites WHERE product_id = ?',
    [productId]
  );
  return rows[0].count;
};
