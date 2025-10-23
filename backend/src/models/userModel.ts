import pool from '../config/database';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  phone?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async create(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'phone'>): Promise<number> {
    const { username, email, password, avatar } = user;
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
        [username, email, password, avatar || null]
      );
      return (result as any).insertId;
    } catch (error: any) {
      console.error('用户创建失败:', {
        username,
        email,
        error: {
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
          message: error.message,
          sql: error.sql
        }
      });
      throw error; // 重新抛出错误，让控制器处理
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar, phone, created_at FROM users WHERE id = ?',
      [id]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar, phone, created_at FROM users'
    );
    return rows as User[];
  }

  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async updateProfile(id: number, updates: Partial<Pick<User, 'username' | 'email' | 'avatar' | 'phone'>>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.username) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return (result as any).affectedRows > 0;
  }

  static async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return (result as any).affectedRows > 0;
  }
}