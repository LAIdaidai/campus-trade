import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as MessageModel from '../models/messageModel';

/**
 * 获取或创建会话
 */
export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, sellerId } = req.body;
    const buyerId = req.user?.userId;

    if (!buyerId) {
      return res.status(401).json({ error: '未授权' });
    }

    if (!productId || !sellerId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const conversation = await MessageModel.getOrCreateConversation(
      productId,
      buyerId,
      sellerId
    );

    res.json({ conversation });
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
};

/**
 * 获取用户的会话列表
 */
export const getUserConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const conversations = await MessageModel.getUserConversations(userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
};

/**
 * 获取会话的消息历史
 */
export const getConversationMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const messages = await MessageModel.getConversationMessages(
      conversationId,
      limit,
      offset
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    res.status(500).json({ error: '获取消息历史失败' });
  }
};

/**
 * 发送消息
 */
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📨 收到发送消息请求:', {
      params: req.params,
      body: req.body,
      userId: req.user?.userId
    });

    const conversationId = parseInt(req.params.conversationId);
    const senderId = req.user?.userId;
    const { receiver_id, content, type } = req.body;

    if (!senderId) {
      console.error('❌ 未授权: userId 不存在');
      return res.status(401).json({ error: '未授权' });
    }

    if (!receiver_id || !content) {
      console.error('❌ 缺少必要参数:', { receiver_id, content });
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 验证用户是否是会话参与者
    const conversation = await MessageModel.getConversationById(conversationId);
    console.log('📋 会话信息:', conversation);
    
    if (!conversation) {
      console.error('❌ 会话不存在:', conversationId);
      return res.status(404).json({ error: '会话不存在' });
    }

    if (conversation.buyer_id !== senderId && conversation.seller_id !== senderId) {
      console.error('❌ 无权发送消息:', { 
        senderId, 
        buyer_id: conversation.buyer_id, 
        seller_id: conversation.seller_id 
      });
      return res.status(403).json({ error: '无权在此会话中发送消息' });
    }

    console.log('✅ 开始发送消息:', { conversationId, senderId, receiver_id, type });
    
    const message = await MessageModel.sendMessage(
      conversationId,
      senderId,
      receiver_id,
      content,
      type || 'text'
    );

    console.log('✅ 消息发送成功:', message);

    res.json({ 
      success: true,
      message,
      conversationId,
      sender_id: senderId
    });
  } catch (error) {
    console.error('❌ Error in sendMessage:', error);
    console.error('错误堆栈:', (error as Error).stack);
    res.status(500).json({ 
      error: '发送消息失败',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    await MessageModel.markMessagesAsRead(conversationId, userId);
    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
};

/**
 * 获取未读消息数
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    const count = await MessageModel.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({ error: '获取未读数失败' });
  }
};

/**
 * 删除会话
 */
export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未授权' });
    }

    if (!conversationId || isNaN(conversationId)) {
      return res.status(400).json({ error: '无效的会话ID' });
    }

    // 验证用户是否是会话参与者
    const conversation = await MessageModel.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: '会话不存在' });
    }

    if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
      return res.status(403).json({ error: '无权删除此会话' });
    }

    // 删除会话
    await MessageModel.deleteConversation(conversationId);
    
    res.json({ message: '会话已删除' });
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    res.status(500).json({ error: '删除会话失败' });
  }
};
