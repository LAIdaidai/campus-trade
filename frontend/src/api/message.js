import request from './request';

// 获取或创建会话
export const getOrCreateConversation = (productId, sellerId) => {
  return request({
    url: '/messages/conversations',
    method: 'post',
    data: { productId, sellerId }
  });
};

// 获取用户的会话列表
export const getUserConversations = () => {
  return request({
    url: '/messages/conversations',
    method: 'get'
  });
};

// 获取会话的消息历史
export const getConversationMessages = (conversationId, limit = 50, offset = 0) => {
  return request({
    url: `/messages/conversations/${conversationId}/messages`,
    method: 'get',
    params: { limit, offset }
  });
};

// 发送消息
export const sendMessage = (data) => {
  return request({
    url: `/messages/conversations/${data.conversation_id}/messages`,
    method: 'post',
    data: {
      receiver_id: data.receiver_id,
      content: data.content,
      type: data.type || 'text'
    }
  });
};

// 标记消息为已读
export const markMessagesAsRead = (conversationId) => {
  return request({
    url: `/messages/conversations/${conversationId}/read`,
    method: 'put'
  });
};

// 获取未读消息数
export const getUnreadCount = () => {
  return request({
    url: '/messages/unread-count',
    method: 'get'
  });
};

// 删除会话
export const deleteConversation = (conversationId) => {
  return request({
    url: `/messages/conversations/${conversationId}`,
    method: 'delete'
  });
};
