import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.messageCallbacks = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      // already connected
      return;
    }

  // Socket.IO 连接到后端服务器
  // 根据环境自动选择连接地址
  const isProd = import.meta.env.PROD || window.location.hostname !== 'localhost'
  let socketUrl
  
  if (isProd) {
    // 生产环境：使用相对路径，让nginx代理处理
    socketUrl = `${window.location.protocol}//${window.location.host}`
  } else {
    // 开发环境：直接连接后端
    socketUrl = 'http://localhost:3000'
  }
    
    console.log('Socket.IO 连接地址:', socketUrl)
    
    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'], // 添加polling作为备选
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10, // 增加重连次数
      timeout: 30000, // 增加超时时间
      // 添加路径配置，确保与后端一致
      path: '/socket.io/',
      // 增加ping配置
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket 连接成功');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket 连接断开:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket 连接错误:', error);
    });

    // 注册消息监听器
    this.socket.on('new_message', (data) => {
      this.triggerCallbacks('new_message', data);
    });

    this.socket.on('message_sent', (data) => {
      this.triggerCallbacks('message_sent', data);
    });

    this.socket.on('unread_count_updated', (data) => {
      this.triggerCallbacks('unread_count_updated', data);
    });

    this.socket.on('user_typing', (data) => {
      this.triggerCallbacks('user_typing', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      this.triggerCallbacks('user_stop_typing', data);
    });

    this.socket.on('message_error', (data) => {
      this.triggerCallbacks('message_error', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.messageCallbacks.clear();
    }
  }

  sendMessage(data) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('send_message', data);
  }

  markAsRead(conversationId) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('mark_as_read', { conversationId });
  }

  typing(conversationId, receiverId) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('typing', { conversationId, receiverId });
  }

  stopTyping(conversationId, receiverId) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('stop_typing', { conversationId, receiverId });
  }

  on(event, callback) {
    if (!this.messageCallbacks.has(event)) {
      this.messageCallbacks.set(event, []);
    }
    this.messageCallbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (!callback) {
      this.messageCallbacks.delete(event);
      return;
    }
    const callbacks = this.messageCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  triggerCallbacks(event, data) {
    const callbacks = this.messageCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
