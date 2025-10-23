import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Order extends RowDataPacket {
  id: number;
  product_id: number;
  seller_id: number;
  buyer_id: number;
  price: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  address_id?: number;
  remark?: string;
  created_at: Date;
  paid_at?: Date;
  shipped_at?: Date;
  completed_at?: Date;
  deleted_at?: Date;
  // 关联数据
  product_title?: string;
  product_image?: string;
  buyer_name?: string;
  buyer_avatar?: string;
  seller_name?: string;
  seller_avatar?: string;
  address_detail?: string;
  address_name?: string;
  address_phone?: string;
  address_full?: string;
}

/**
 * 创建订单
 */
export const createOrder = async (
  productId: number,
  sellerId: number,
  buyerId: number,
  price: number,
  addressId?: number,
  remark?: string
): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO orders (product_id, seller_id, buyer_id, price, address_id, remark, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [productId, sellerId, buyerId, price, addressId, remark]
  );

  return result.insertId;
};

/**
 * 根据ID获取订单
 */
export const getOrderById = async (orderId: number): Promise<Order | null> => {
  const [rows] = await pool.query<Order[]>(
    `SELECT o.*,
            p.title as product_title,
            p.images as product_image,
            u_buyer.username as buyer_name,
            u_buyer.avatar as buyer_avatar,
            u_seller.username as seller_name,
            u_seller.avatar as seller_avatar,
            CONCAT_WS(' ', 
              addr.province, addr.city, addr.district, addr.detail,
              '(', addr.name, ' ', addr.phone, ')'
            ) as address_detail,
            addr.name as address_name,
            addr.phone as address_phone,
            CONCAT_WS(' ', addr.province, addr.city, addr.district, addr.detail) as address_full
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
     LEFT JOIN users u_seller ON o.seller_id = u_seller.id
     LEFT JOIN user_addresses addr ON o.address_id = addr.id
     WHERE o.id = ?`,
    [orderId]
  );

  if (rows.length > 0) {
    const order = rows[0];
    // 解析商品图片
    if (order.product_image) {
      const images = typeof order.product_image === 'string' 
        ? JSON.parse(order.product_image) 
        : order.product_image;
      order.product_image = images && images.length > 0 ? images[0] : null;
    }
    return order;
  }

  return null;
};

/**
 * 获取用户的订单列表（买家或卖家）
 */
export const getUserOrders = async (
  userId: number,
  role: 'buyer' | 'seller' = 'buyer'
): Promise<Order[]> => {
  const userField = role === 'buyer' ? 'buyer_id' : 'seller_id';
  
  const [rows] = await pool.query<Order[]>(
    `SELECT o.*,
            p.title as product_title,
            p.images as product_image,
            u_buyer.username as buyer_name,
            u_buyer.avatar as buyer_avatar,
            u_seller.username as seller_name,
            u_seller.avatar as seller_avatar
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     LEFT JOIN users u_buyer ON o.buyer_id = u_buyer.id
     LEFT JOIN users u_seller ON o.seller_id = u_seller.id
     WHERE o.${userField} = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  // 解析每个订单的商品图片
  return rows.map(order => {
    if (order.product_image) {
      const images = typeof order.product_image === 'string' 
        ? JSON.parse(order.product_image) 
        : order.product_image;
      order.product_image = images && images.length > 0 ? images[0] : null;
    }
    return order;
  });
};

/**
 * 更新订单状态
 */
export const updateOrderStatus = async (
  orderId: number,
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
): Promise<void> => {
  const statusTimeMap: { [key: string]: string } = {
    'paid': 'paid_at',
    'shipped': 'shipped_at',
    'completed': 'completed_at'
  };

  const statusTimeField = statusTimeMap[status];

  if (statusTimeField) {
    await pool.query(
      `UPDATE orders SET status = ?, ${statusTimeField} = NOW() WHERE id = ?`,
      [status, orderId]
    );
  } else {
    await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
  }
};

/**
 * 取消订单
 */
export const cancelOrder = async (orderId: number): Promise<void> => {
  await pool.query(
    'UPDATE orders SET status = ? WHERE id = ?',
    ['cancelled', orderId]
  );
};

/**
 * 软删除超过N天的已完成订单，并返回受影响订单(用于清理图片)
 */
export const findCompletedOrdersBefore = async (days: number): Promise<Order[]> => {
  const [rows] = await pool.query<Order[]>(
    `SELECT o.*, p.images as product_image
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     WHERE o.status = 'completed' AND o.completed_at IS NOT NULL AND o.completed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return rows;
};

export const hardDeleteOrders = async (orderIds: number[]): Promise<void> => {
  if (!orderIds.length) return;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // 删除关联消息、会话由外键或应用层处理，此处仅删除订单本身
    await connection.query('DELETE FROM orders WHERE id IN (' + orderIds.map(() => '?').join(',') + ')', orderIds);
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
};

