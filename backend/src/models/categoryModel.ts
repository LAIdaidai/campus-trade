import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  created_at: Date;
}

export const getAllCategories = async (): Promise<Category[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM categories ORDER BY sort_order ASC'
  );
  return rows as Category[];
};

export const getCategoryById = async (id: number): Promise<Category | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? (rows[0] as Category) : null;
};
