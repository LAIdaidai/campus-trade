<template>
  <div class="messages-container" :class="{ 'mobile': isMobile, 'chat-open': isMobile && currentConversation }">
    <!-- 左侧会话列表 -->
    <div class="conversations-sidebar" :class="{ 'hidden': isMobile && currentConversation }">
      <div class="sidebar-header">
        <h2>消息</h2>
        <div v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</div>
      </div>
      
      <div class="conversations-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: currentConversation?.id === conv.id }"
          @click="selectConversation(conv)"
        >
          <div class="avatar">
            <img :src="getImageUrl(conv.other_user_avatar) || '/default-avatar.png'" :alt="conv.other_user_name" />
          </div>
          <div class="conversation-info">
            <div class="top-row">
              <div class="user-name">{{ conv.other_user_name }}</div>
              <div class="time">{{ formatTime(conv.last_message_time) }}</div>
            </div>
            <div class="bottom-row">
              <div class="last-message">{{ formatLastMessage(conv) }}</div>
              <div v-if="getUnreadCountForConv(conv) > 0" class="unread-count">
                {{ getUnreadCountForConv(conv) }}
              </div>
            </div>
            <div class="product-info">
              <img v-if="conv.product_image" :src="getImageUrl(conv.product_image)" alt="" class="product-thumb" />
              <span class="product-title">{{ conv.product_title }}</span>
            </div>
          </div>
          <button 
            class="delete-conversation-btn" 
            @click.stop="handleDeleteConversation(conv)"
            title="删除会话"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        
        <div v-if="conversations.length === 0" class="empty-state">
          <p>暂无消息</p>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area" :class="{ 'show': isMobile && currentConversation }">
      <div v-if="!currentConversation" class="empty-chat">
        <div class="empty-icon">💬</div>
        <p>选择一个会话开始聊天</p>
      </div>

      <template v-else>
        <!-- 聊天头部 -->
        <div class="chat-header">
          <!-- 移动端返回按钮 -->
          <button v-if="isMobile" @click="backToList" class="btn-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="user-info">
            <img :src="getImageUrl(currentConversation.other_user_avatar) || '/default-avatar.png'" alt="" class="avatar" />
            <div class="info">
              <div class="name">{{ currentConversation.other_user_name }}</div>
              <div class="product-name">
                关于: {{ currentConversation.product_title }}
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button @click="viewProduct" class="btn-link">查看商品</button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div ref="messagesContainer" class="messages-list">
          <div v-if="isLoadingMessages" class="loading">加载中...</div>
          
          <div
            v-for="(message, index) in messages"
            :key="message.id"
            class="message-item"
            :class="{ 'is-mine': message.sender_id === currentUserId }"
          >
            <!-- 文本消息 -->
            <template v-if="message.type === 'text'">
              <div class="message-avatar">
                <img :src="getImageUrl(message.sender_avatar) || '/default-avatar.png'" alt="" />
              </div>
              <div class="message-content">
                <div class="message-bubble">
                  {{ message.content }}
                </div>
                <div class="message-footer">
                  <div class="message-time">{{ formatMessageTime(message.created_at) }}</div>
                  <div v-if="message.sender_id === currentUserId" class="read-status">
                    <span v-if="message.is_read" class="read">已读</span>
                    <span v-else class="unread">未读</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 订单消息 -->
            <OrderMessage
              v-else-if="message.type === 'order'"
              :order-data="JSON.parse(message.content)"
              :is-mine="message.sender_id === currentUserId"
              :is-seller="isSeller"
              :is-latest-order="isLatestOrder(message, index)"
              @modify-price="handleModifyPrice"
              @confirm="handleSellerConfirm"
              @cancel="handleCancelOrder"
              @buyer-confirm="handleBuyerConfirm"
              @view-order="handleViewOrder"
            />
          </div>

          <div v-if="isTyping" class="typing-indicator">
            {{ currentConversation.other_user_name }} 正在输入...
          </div>
        </div>

        <!-- 输入框 -->
        <div class="chat-input-area">
          <!-- 发起订单按钮 (只有买家且商品在售) -->
          <div v-if="currentConversation && !isSeller" class="order-button-wrapper">
            <button 
               class="create-order-btn"
               :disabled="currentConversation.product_status === 'sold'"
               @click="handleCreateOrderClick"
            >
               {{ currentConversation.product_status === 'sold' ? '已售出，无法下单' : '发起订单' }}
            </button>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="messageInput"
              placeholder="输入消息..."
              @keydown.enter.exact="handleSendMessage"
              @input="handleTyping"
              rows="3"
            ></textarea>
            <button @click="handleSendMessage" class="btn-send" :disabled="!messageInput.trim()">
              发送
            </button>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 撤回提示 -->
    <UndoToast 
      ref="undoToastRef" 
      :message="undoMessage"
      @undo="handleUndoDelete"
    />

    <!-- 发起订单对话框 -->
    <CreateOrderDialog
      :visible="showCreateOrderDialog"
      :product="{
        title: currentConversation?.product_title,
        price: currentConversation?.product_price,
        image: currentConversation?.product_image ? getImageUrl(currentConversation.product_image) : ''
      }"
      @close="showCreateOrderDialog = false"
      @submit="handleCreateOrder"
    />

    <!-- 修改价格对话框 -->
    <ModifyPriceDialog
      :visible="showModifyPriceDialog"
      :order-data="currentOrderData"
      @close="showModifyPriceDialog = false"
      @submit="handlePriceModified"
    />

    <!-- 订单详情对话框 -->
    <OrderDetailDialog
      v-if="selectedOrderDetail"
      :visible="showOrderDetailDialog"
      :order="selectedOrderDetail"
      @close="showOrderDetailDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import socketService from '../utils/socket';
import * as messageApi from '../api/message';
import UndoToast from '../components/UndoToast.vue';
import toast from '../utils/toast';
import OrderMessage from '../components/OrderMessage.vue';
import CreateOrderDialog from '../components/CreateOrderDialog.vue';
import ModifyPriceDialog from '../components/ModifyPriceDialog.vue';
import OrderDetailDialog from '../components/OrderDetailDialog.vue';
import { createOrder, getOrderById } from '../api/order';
import { getImageUrl } from '../config';

const router = useRouter();
const userStore = useUserStore();

// 数据
const conversations = ref([]);
const currentConversation = ref(null);
const messages = ref([]);
const messageInput = ref('');
const isLoadingMessages = ref(false);
const isTyping = ref(false);
const unreadCount = ref(0);
const messagesContainer = ref(null);
const isMobile = ref(false);
const undoToastRef = ref(null);
const undoMessage = ref('');
const deletedConversation = ref(null);
let deleteTimer = null;

// 订单相关状态
const showCreateOrderDialog = ref(false);
const showModifyPriceDialog = ref(false);
const currentOrderData = ref(null);
const showOrderDetailDialog = ref(false);
const selectedOrderDetail = ref(null);

let typingTimeout = null;

// 检测是否为移动端（包括iPad竖屏）
const checkMobile = () => {
  const width = window.innerWidth;
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  
  // 768px以下，或者1024px以下且竖屏（iPad竖屏）
  isMobile.value = width <= 768 || (width <= 1024 && isPortrait);
};

// 移动端返回到会话列表
const backToList = () => {
  currentConversation.value = null;
};

const currentUserId = computed(() => {
  const userId = userStore.userInfo?.id;
  return userId;
});

// 判断当前用户是否是卖家
const isSeller = computed(() => {
  return currentConversation.value?.seller_id === currentUserId.value;
});

// 判断是否是最新的订单消息
const isLatestOrder = (message, currentIndex) => {
  if (message.type !== 'order') return true;
  
  try {
    const currentOrderData = JSON.parse(message.content);
    const productId = currentOrderData.product_id;
    
    // 检查后面是否还有相同商品的订单消息
    for (let i = currentIndex + 1; i < messages.value.length; i++) {
      const laterMessage = messages.value[i];
      if (laterMessage.type === 'order') {
        try {
          const laterOrderData = JSON.parse(laterMessage.content);
          if (laterOrderData.product_id === productId) {
            // 有更新的订单消息
            return false;
          }
        } catch (e) {
          // 解析失败，忽略
        }
      }
    }
    
    return true;
  } catch (e) {
    return true;
  }
};

// 加载会话列表
const loadConversations = async () => {
  try {
    const res = await messageApi.getUserConversations();
    conversations.value = res.conversations || [];
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
};

// 选择会话
const selectConversation = async (conv) => {
  // 防止重复点击
  if (currentConversation.value?.id === conv.id) {
    return;
  }
  
  try {
    currentConversation.value = conv;
    await loadMessages(conv.id);
    
    // 标记为已读
    await messageApi.markMessagesAsRead(conv.id);
    if (socketService.isConnected) {
      socketService.markAsRead(conv.id);
    }
    
    // 更新会话列表中的未读数
    const index = conversations.value.findIndex(c => c.id === conv.id);
    if (index > -1) {
      const isBuyer = conversations.value[index].buyer_id === currentUserId.value;
      if (isBuyer) {
        conversations.value[index].buyer_unread_count = 0;
      } else {
        conversations.value[index].seller_unread_count = 0;
      }
    }
  } catch (error) {
    console.error('选择会话失败:', error);
    toast.error('加载会话失败，请重试');
  }
};

// 加载消息历史
const loadMessages = async (conversationId) => {
  isLoadingMessages.value = true;
  try {
    const res = await messageApi.getConversationMessages(conversationId);
    messages.value = res.messages || [];
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Failed to load messages:', error);
  } finally {
    isLoadingMessages.value = false;
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim() || !currentConversation.value) {
    return;
  }

  const content = messageInput.value.trim();
  messageInput.value = '';

  try {
    // 优先使用WebSocket发送
    if (socketService.isConnected) {
      socketService.sendMessage({
        conversationId: currentConversation.value.id,
        receiverId: currentConversation.value.other_user_id,
        content,
        type: 'text'
      });

      // 停止输入状态
      socketService.stopTyping(
        currentConversation.value.id,
        currentConversation.value.other_user_id
      );
    } else {
      // WebSocket未连接，使用HTTP API
      const response = await messageApi.sendMessage({
        conversation_id: currentConversation.value.id,
        receiver_id: currentConversation.value.other_user_id,
        content,
        type: 'text'
      });

      // 手动添加到消息列表
      if (response.message) {
        messages.value.push(response.message);
        nextTick(() => scrollToBottom());
      }

      // 更新会话列表
      loadConversations();
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    toast.error('发送消息失败');
    // 恢复输入内容
    messageInput.value = content;
  }
};

// 处理正在输入
const handleTyping = () => {
  if (!currentConversation.value) return;

  socketService.typing(
    currentConversation.value.id,
    currentConversation.value.other_user_id
  );

  // 3秒后自动停止输入状态
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socketService.stopTyping(
      currentConversation.value.id,
      currentConversation.value.other_user_id
    );
  }, 3000);
};

// 查看商品
const viewProduct = () => {
  if (currentConversation.value?.product_id) {
    router.push(`/product/${currentConversation.value.product_id}`);
  }
};

// 处理发起订单按钮点击
const handleCreateOrderClick = () => {
  if (currentConversation.value?.product_status !== 'sold') {
    showCreateOrderDialog.value = true;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 获取会话未读数
const getUnreadCountForConv = (conv) => {
  const isBuyer = conv.buyer_id === currentUserId.value;
  return isBuyer ? conv.buyer_unread_count : conv.seller_unread_count;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
};

// 格式化最后一条消息显示
const formatLastMessage = (conv) => {
  if (!conv.last_message) return '暂无消息';
  
  // 尝试解析JSON（订单消息）
  try {
    const orderData = JSON.parse(conv.last_message);
    if (orderData.product_id && orderData.status) {
      // 这是订单消息
      const statusMap = {
        'pending': '📦 您有一个待确认的订单',
        'modified': '💰 订单价格已修改',
        'confirmed': '✅ 订单已确认',
        'rejected': '❌ 订单已取消'
      };
      return statusMap[orderData.status] || '📦 订单消息';
    }
  } catch (e) {
    // 不是JSON，正常文本消息
  }
  
  return conv.last_message;
};

const formatMessageTime = (time) => {
  const date = new Date(time);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 加载未读数
const loadUnreadCount = async () => {
  try {
    const res = await messageApi.getUnreadCount();
    unreadCount.value = res.count || 0;
  } catch (error) {
    console.error('Failed to load unread count:', error);
  }
};

// 删除会话
const handleDeleteConversation = async (conv) => {
  try {
    // 先从UI移除，提供撤回入口
    deletedConversation.value = { ...conv };
    conversations.value = conversations.value.filter(c => c.id !== conv.id);

    if (currentConversation.value?.id === conv.id) {
      currentConversation.value = null;
      messages.value = [];
    }

    // 显示撤回提示
    undoMessage.value = `已删除与 ${conv.other_user_name} 的会话`;
    undoToastRef.value?.show();

    // 清理已有计时器
    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    // 延迟真正删除（4秒可撤回）
    deleteTimer = setTimeout(async () => {
      try {
        if (deletedConversation.value && deletedConversation.value.id === conv.id) {
          await messageApi.deleteConversation(conv.id);
          deletedConversation.value = null;
          await loadUnreadCount();
        }
      } catch (err) {
        console.error('延迟删除会话失败:', err);
      } finally {
        deleteTimer = null;
      }
    }, 4000);
  } catch (error) {
    console.error('删除会话失败:', error);
    toast.error('删除会话失败');
  }
};

// 撤回删除会话
const handleUndoDelete = () => {
  if (!deletedConversation.value) return;

  try {
    // 取消定时删除
    if (deleteTimer) {
      clearTimeout(deleteTimer);
      deleteTimer = null;
    }

    // 恢复到列表
    conversations.value.push(deletedConversation.value);
    conversations.value.sort((a, b) => 
      new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
    );

    deletedConversation.value = null;
    toast.success('已撤回删除');
  } catch (error) {
    console.error('撤回失败:', error);
    deletedConversation.value = null;
    toast.error('撤回失败');
  }
};

// Socket 事件处理
const handleNewMessage = (data) => {
  const { conversationId, message } = data;
  
  
  
  // 如果是当前会话的消息
  if (currentConversation.value?.id === conversationId) {
    // 检查是否已经存在（避免重复）
    const exists = messages.value.some(m => 
      m.id === message.id || 
      (m.content === message.content && m.created_at === message.created_at)
    );
    
    if (!exists) {
      messages.value.push(message);
      nextTick(() => scrollToBottom());
    }
    
    // 如果是对方发来的消息，自动标记为已读
    if (message.sender_id !== currentUserId.value) {
      messageApi.markMessagesAsRead(conversationId);
      socketService.markAsRead(conversationId);
    }
  } else if (message.sender_id !== currentUserId.value) {
    // 只有对方发来的消息才更新会话列表（避免重复更新）
    loadConversations();
  }
  
  // 更新未读数（只有对方发来的消息才更新）
  if (message.sender_id !== currentUserId.value) {
    loadUnreadCount();
  }
};

const handleMessageSent = (data) => {
  const { conversationId, message } = data;
  
  
  
  // 添加到当前会话的消息列表
  if (currentConversation.value?.id === conversationId) {
    messages.value.push(message);
    nextTick(() => scrollToBottom());
  }
  
  // 更新会话列表
  loadConversations();
};

const handleUnreadCountUpdated = (data) => {
  unreadCount.value = data.count;
};

const handleUserTyping = (data) => {
  if (currentConversation.value?.id === data.conversationId) {
    isTyping.value = true;
  }
};

const handleUserStopTyping = (data) => {
  if (currentConversation.value?.id === data.conversationId) {
    isTyping.value = false;
  }
};

const handleMessagesRead = (data) => {
  const { conversationId } = data;
  
  
  
  // 如果是当前会话,更新消息的已读状态
  if (currentConversation.value?.id === conversationId) {
    messages.value.forEach(msg => {
      if (msg.sender_id === currentUserId.value) {
        msg.is_read = true;
      }
    });
  }
  
  // 重新加载会话列表以更新未读数（实时刷新）
  loadConversations();
};

// 生命周期
onMounted(async () => {
  // 检测移动端
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // 连接 WebSocket
  const token = localStorage.getItem('token');
  if (token) {
    socketService.connect(token);
  }

  
  // 注册事件监听
  socketService.on('new_message', handleNewMessage);
  socketService.on('message_sent', handleMessageSent);
  socketService.on('unread_count_updated', handleUnreadCountUpdated);
  socketService.on('user_typing', handleUserTyping);
  socketService.on('user_stop_typing', handleUserStopTyping);
  socketService.on('messages_read', handleMessagesRead);

  // 加载数据
  await loadConversations();
  await loadUnreadCount();
  
  // 如果有路由参数,直接打开对应会话
  const conversationId = router.currentRoute.value.query.conversationId;
  if (conversationId) {
    const conv = conversations.value.find(c => c.id === parseInt(conversationId));
    if (conv) {
      selectConversation(conv);
    }
  }
});

// 订单相关功能
// 发起订单
const handleCreateOrder = async (orderInfo) => {
  try {
    // 二次校验：商品必须在售
    if (currentConversation.value?.product_status === 'sold') {
      toast.error('该商品已售出，无法发起订单');
      return;
    }

    const orderData = {
      product_id: currentConversation.value.product_id,
      product_title: currentConversation.value.product_title,
      product_image: currentConversation.value.product_image,
      original_price: currentConversation.value.product_price,
      final_price: currentConversation.value.product_price,
      address_id: orderInfo.address_id,
      address_detail: orderInfo.address_detail,
      status: 'pending',
      remark: orderInfo.remark
    };

    const response = await messageApi.sendMessage({
      conversation_id: currentConversation.value.id,
      receiver_id: currentConversation.value.seller_id,
      content: JSON.stringify(orderData),
      type: 'order'
    });

    showCreateOrderDialog.value = false;
    toast.success('订单已发送');
    
    // 立即更新当前会话的最后一条消息
    const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
    if (convIndex !== -1) {
      conversations.value[convIndex].last_message = JSON.stringify(orderData);
      conversations.value[convIndex].last_message_time = new Date().toISOString();
      
      // 将这个会话移到列表顶部
      const conv = conversations.value.splice(convIndex, 1)[0];
      conversations.value.unshift(conv);
    }
    
    // 如果有返回的消息，添加到消息列表
    if (response.message) {
      messages.value.push(response.message);
      nextTick(() => scrollToBottom());
    }
  } catch (error) {
    console.error('发送订单失败:', error);
    toast.error('发送订单失败');
  }
};

// 修改价格
const handleModifyPrice = (orderData) => {
  currentOrderData.value = orderData;
  showModifyPriceDialog.value = true;
};

// 提交修改后的价格
const handlePriceModified = async (data) => {
  try {
    const newOrderData = {
      ...currentOrderData.value,
      final_price: data.new_price,
      status: 'modified'
    };

    const response = await messageApi.sendMessage({
      conversation_id: currentConversation.value.id,
      receiver_id: currentConversation.value.buyer_id,
      content: JSON.stringify(newOrderData),
      type: 'order'
    });

    showModifyPriceDialog.value = false;
    toast.success('价格已修改');
    
    // 立即更新当前会话的最后一条消息
    const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
    if (convIndex !== -1) {
      conversations.value[convIndex].last_message = JSON.stringify(newOrderData);
      conversations.value[convIndex].last_message_time = new Date().toISOString();
      
      // 将这个会话移到列表顶部
      const conv = conversations.value.splice(convIndex, 1)[0];
      conversations.value.unshift(conv);
    }
    
    // 如果有返回的消息，添加到消息列表
    if (response.message) {
      messages.value.push(response.message);
      nextTick(() => scrollToBottom());
    }
  } catch (error) {
    console.error('修改价格失败:', error);
    toast.error('修改价格失败');
  }
};

// 买家确认订单
const handleBuyerConfirm = async (orderData) => {
  try {
    // 创建正式订单
    const response = await createOrder({
      product_id: orderData.product_id,
      seller_id: currentConversation.value.seller_id,
      price: orderData.final_price,
      address_id: orderData.address_id,
      remark: orderData.remark
    });

    if (response.success) {
      // 发送确认消息
      const confirmedOrderData = {
        ...orderData,
        status: 'confirmed',
        order_id: response.data.order_id
      };

      const msgResponse = await messageApi.sendMessage({
        conversation_id: currentConversation.value.id,
        receiver_id: currentConversation.value.seller_id,
        content: JSON.stringify(confirmedOrderData),
        type: 'order'
      });

      toast.success('订单创建成功');
      
      // 立即更新会话列表
      const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
      if (convIndex !== -1) {
        conversations.value[convIndex].last_message = JSON.stringify(confirmedOrderData);
        conversations.value[convIndex].last_message_time = new Date().toISOString();
        
        const conv = conversations.value.splice(convIndex, 1)[0];
        conversations.value.unshift(conv);
      }
      
      // 添加消息到列表
      if (msgResponse.message) {
        messages.value.push(msgResponse.message);
        nextTick(() => scrollToBottom());
      }
    }
  } catch (error) {
    console.error('确认订单失败:', error);
    toast.error('确认订单失败');
  }
};

// 卖家确认订单
const handleSellerConfirm = async (orderData) => {
  try {
    // 创建订单
    const response = await createOrder({
      product_id: orderData.product_id,
      seller_id: currentConversation.value.seller_id,
      price: orderData.final_price,
      address_id: orderData.address_id,
      remark: orderData.remark
    });

    if (response.success) {
      const confirmedOrderData = {
        ...orderData,
        status: 'confirmed',
        order_id: response.data.order_id
      };

      const msgResponse = await messageApi.sendMessage({
        conversation_id: currentConversation.value.id,
        receiver_id: currentConversation.value.buyer_id,
        content: JSON.stringify(confirmedOrderData),
        type: 'order'
      });

      toast.success('订单已确认');
      
      // 立即更新会话列表
      const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
      if (convIndex !== -1) {
        conversations.value[convIndex].last_message = JSON.stringify(confirmedOrderData);
        conversations.value[convIndex].last_message_time = new Date().toISOString();
        
        const conv = conversations.value.splice(convIndex, 1)[0];
        conversations.value.unshift(conv);
      }
      
      // 添加消息到列表
      if (msgResponse.message) {
        messages.value.push(msgResponse.message);
        nextTick(() => scrollToBottom());
      }
    }
  } catch (error) {
    console.error('确认订单失败:', error);
    toast.error('确认订单失败');
  }
};

// 取消订单
const handleCancelOrder = async (orderData) => {
  const rejectedOrderData = {
    ...orderData,
    status: 'rejected'
  };

  try {
    const response = await messageApi.sendMessage({
      conversation_id: currentConversation.value.id,
      receiver_id: isSeller.value ? currentConversation.value.buyer_id : currentConversation.value.seller_id,
      content: JSON.stringify(rejectedOrderData),
      type: 'order'
    });

    toast.success('订单已取消');
    
    // 立即更新会话列表
    const convIndex = conversations.value.findIndex(c => c.id === currentConversation.value.id);
    if (convIndex !== -1) {
      conversations.value[convIndex].last_message = JSON.stringify(rejectedOrderData);
      conversations.value[convIndex].last_message_time = new Date().toISOString();
      
      const conv = conversations.value.splice(convIndex, 1)[0];
      conversations.value.unshift(conv);
    }
    
    // 添加消息到列表
    if (response.message) {
      messages.value.push(response.message);
      nextTick(() => scrollToBottom());
    }
  } catch (error) {
    console.error('取消订单失败:', error);
    toast.error('取消订单失败');
  }
};

// 查看订单详情
const handleViewOrder = async (orderData) => {
  try {
    // 跳到个人页-我的订单，并根据角色切到对应tab
    const isBuyer = currentConversation.value?.buyer_id === currentUserId.value;
    const tab = isBuyer ? 'bought' : 'sold';
    router.push({ name: 'Profile', query: { menu: 'orders', tab } });
  } catch (error) {
    console.error('跳转订单页失败:', error);
  }
};

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  
  // 移除事件监听
  socketService.off('new_message', handleNewMessage);
  socketService.off('message_sent', handleMessageSent);
  socketService.off('unread_count_updated', handleUnreadCountUpdated);
  socketService.off('user_typing', handleUserTyping);
  socketService.off('user_stop_typing', handleUserStopTyping);
  socketService.off('messages_read', handleMessagesRead);
  
  clearTimeout(typingTimeout);
});

// 监听当前会话变化,重置输入状态
watch(currentConversation, () => {
  isTyping.value = false;
});
</script>

<style scoped>
.messages-container {
  display: flex;
  height: calc(100vh - 80px);
  margin-top: 20px;
  margin-left: 20px;
  margin-right: 20px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 左侧会话列表 */
.conversations-sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px 0 0 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.04);
}

.sidebar-header {
  padding: 24px 20px;
  background: linear-gradient(135deg, rgba(255, 36, 66, 0.05) 0%, rgba(255, 99, 107, 0.03) 100%);
  border-bottom: 1px solid rgba(255, 36, 66, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.unread-badge {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 36, 66, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.conversations-list::-webkit-scrollbar {
  width: 6px;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.conversations-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin: 4px 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.conversation-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  border-radius: 0 3px 3px 0;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.conversation-item:hover {
  background: rgba(255, 36, 66, 0.04);
  transform: translateX(4px);
}

.conversation-item:active {
  transform: translateX(2px) scale(0.98);
  transition: all 0.1s ease;
}

.conversation-item:hover::before {
  height: 60%;
}

.conversation-item.active {
  background: linear-gradient(135deg, rgba(255, 36, 66, 0.08) 0%, rgba(255, 36, 66, 0.04) 100%);
  box-shadow: 0 2px 12px rgba(255, 36, 66, 0.1);
}

.conversation-item.active::before {
  height: 80%;
}

.conversation-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.conversation-item .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.last-message {
  flex: 1;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-count {
  background: #ff2442;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  margin-left: 8px;
  flex-shrink: 0;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

.product-thumb {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
}

.product-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 删除会话按钮 */
.delete-conversation-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 71, 87, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.delete-conversation-btn svg {
  width: 16px;
  height: 16px;
  color: #ff4757;
}

.conversation-item:hover .delete-conversation-btn {
  opacity: 1;
}

.delete-conversation-btn:hover {
  background: #ff4757;
  transform: translateY(-50%) scale(1.1);
}

.delete-conversation-btn:hover svg {
  color: white;
}

.delete-conversation-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

/* 右侧聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 0 16px 16px 0;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background: linear-gradient(135deg, rgba(255, 36, 66, 0.02) 0%, rgba(255, 99, 107, 0.01) 100%);
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.chat-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  z-index: 10;
}

.chat-header .user-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.chat-header .avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: cover;
  border: none; /* 移除白边 */
  transition: all 0.3s ease;
  display: block; /* 移除图片底部间隙 */
  background: transparent;
}

.chat-header .avatar:hover {
  transform: scale(1.05);
}

.chat-header .info .name {
  font-weight: 700;
  font-size: 17px;
  margin-bottom: 4px;
  color: #333;
}

.chat-header .info .product-name {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-link {
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(255, 36, 66, 0.3);
}

.btn-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 36, 66, 0.45);
}

.messages-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(255, 36, 66, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.02) 0%, transparent 50%);
}

.messages-list::-webkit-scrollbar {
  width: 8px;
}

.messages-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.messages-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.loading {
  text-align: center;
  color: #999;
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: none; /* 移除白边 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: transparent; /* 确保背景透明 */
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* 移除图片底部间隙 */
}

.message-content {
  max-width: 70%; /* 增加最大宽度 */
  margin: 0 12px;
  min-width: 120px; /* 增大最小宽度,减少换行 */
}

.message-item.is-mine .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  background: white;
  word-wrap: break-word;
  word-break: break-word; /* 允许在单词内换行 */
  overflow-wrap: anywhere; /* 更激进的换行策略 */
  white-space: pre-wrap; /* 保留空格和换行 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  font-size: 15px; /* 增大字体 */
  line-height: 1.5;
  position: relative;
  transition: all 0.3s ease;
  white-space: pre-wrap; /* 保留空格和换行,但允许自动换行 */
  min-width: 100px; /* 增大气泡最小宽度 */
  max-width: 100%; /* 确保不超出容器 */
}

.message-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 左侧消息气泡 */
.message-bubble::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 14px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 6px 6px 6px 0;
  border-color: transparent white transparent transparent;
  filter: drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.05));
}

/* 右侧消息气泡(我的消息) */
.message-item.is-mine .message-bubble {
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  color: white;
  box-shadow: 0 2px 12px rgba(255, 36, 66, 0.25);
}

.message-item.is-mine .message-bubble:hover {
  box-shadow: 0 4px 20px rgba(255, 36, 66, 0.35);
}

.message-item.is-mine .message-bubble::before {
  left: auto;
  right: -6px;
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent #ff6b6b;
  filter: drop-shadow(2px 0 2px rgba(255, 36, 66, 0.15));
}

.message-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.message-time {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.message-item.is-mine .message-time {
  color: #bbb;
}

.read-status {
  font-size: 11px;
  font-weight: 500;
}

.read-status .read {
  color: #4caf50;
}

.read-status .unread {
  color: #999;
}

.typing-indicator {
  color: #666;
  font-size: 13px;
  font-style: italic;
  padding: 12px 16px;
  background: rgba(255, 36, 66, 0.05);
  border-radius: 16px;
  display: inline-block;
  animation: typingPulse 1.5s infinite;
}

@keyframes typingPulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.chat-input-area {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.03);
}


/* 订单按钮容器 */
.order-button-wrapper {
  padding: 8px 12px 0 12px;
  display: flex;
  justify-content: flex-start;
}

/* 发起订单按钮 */
.create-order-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(255, 36, 66, 0.25);
}

.create-order-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.35);
}

.create-order-btn:active {
  transform: translateY(0);
}

.input-toolbar {
  padding: 8px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  min-height: 40px;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  padding: 20px 24px;
  gap: 14px;
}

.input-wrapper textarea {
  flex: 1;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.95);
  max-height: 80px; /* 减小输入框最大高度 */
  min-height: 44px; /* 减小最小高度 */
}

.input-wrapper textarea:focus {
  outline: none;
  border-color: rgba(255, 36, 66, 0.4);
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 36, 66, 0.08);
}

.input-wrapper textarea::placeholder {
  color: #999;
}

.btn-send {
  padding: 12px 28px;
  background: linear-gradient(135deg, #ff2442 0%, #ff4757 100%);
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 44px;
  box-shadow: 0 2px 12px rgba(255, 36, 66, 0.3);
  letter-spacing: 0.5px;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 36, 66, 0.45);
}

.btn-send:active:not(:disabled) {
  transform: translateY(0);
}

.btn-send:disabled {
  background: linear-gradient(135deg, #ccc 0%, #ddd 100%);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.6;
}

/* iPad竖屏：使用移动端布局 */
@media (max-width: 1024px) and (orientation: portrait) {
  .messages-container {
    border-radius: 0;
    margin: 0;
    height: 100vh;
  }

  /* 移动端默认显示会话列表 */
  .conversations-sidebar {
    flex: none;
    width: 100%;
    border-radius: 0;
  }

  .conversations-sidebar.hidden {
    display: none;
  }

  /* 移动端聊天区域默认隐藏 */
  .chat-area {
    display: none;
    border-radius: 0;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chat-area.show {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 70px;
    z-index: 100;
    opacity: 1;
    transform: translateX(0);
  }

  /* 返回按钮 */
  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    cursor: pointer;
    margin-right: 12px;
    transition: all 0.3s;
  }

  .btn-back:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .btn-back svg {
    width: 20px;
    height: 20px;
    color: #333;
  }

  .chat-header {
    padding: 14px 18px;
  }

  .message-bubble {
    font-size: 15px;
  }

  /* 删除按钮始终显示 */
  .delete-conversation-btn {
    opacity: 1 !important;
  }
}

/* iPad横屏：优化聊天头部和布局 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .messages-container {
    margin: 20px; /* 统一为20px，和其他页面一致 */
  }

  /* 会话列表更窄,留更多空间给聊天 */
  .conversations-sidebar {
    flex: 0 0 240px; /* 从300px减小到240px，显示正常宽度 */
    min-width: 240px;
  }

  .sidebar-header {
    padding: 18px;
  }

  .sidebar-header h2 {
    font-size: 20px;
  }

  /* 简化会话列表项 */
  .conversation-item {
    padding: 12px;
    margin: 3px 6px;
  }

  .conversation-item .avatar {
    width: 44px;
    height: 44px;
  }

  .conversation-item .avatar img {
    width: 100%;
    height: 100%;
  }

  .user-name {
    font-size: 14px;
  }

  .last-message {
    font-size: 12px;
  }

  .product-thumb {
    width: 26px;
    height: 26px;
  }

  .product-title {
    font-size: 11px;
  }

  /* 简化聊天头部 - 只显示头像和名字 */
  .chat-header {
    padding: 14px 18px;
  }

  .chat-header .user-info {
    gap: 10px;
  }

  .chat-header .avatar {
    width: 38px;
    height: 38px;
  }

  .chat-header .info .name {
    font-size: 15px;
    margin-bottom: 2px;
  }

  .chat-header .info .product-name {
    font-size: 12px;
  }

  .chat-header .btn-link {
    padding: 7px 14px;
    font-size: 13px;
  }

  /* 优化消息区域 */
  .messages-list {
    padding: 16px;
  }

  .message-item {
    margin-bottom: 18px;
  }

  .message-avatar {
    width: 38px;
    height: 38px;
  }

  .message-avatar img {
    width: 100%;
    height: 100%;
  }

  .message-content {
    max-width: 68%;
    min-width: 100px;
  }

  .message-bubble {
    font-size: 14px;
    padding: 11px 15px;
  }

  /* 优化输入框 */
  .input-wrapper {
    padding: 14px 18px;
  }

  .input-wrapper textarea {
    font-size: 14px;
  }

  .btn-send {
    padding: 11px 24px;
    font-size: 14px;
  }

  /* iPad横屏删除按钮半透明显示 */
  .delete-conversation-btn {
    opacity: 0.7;
  }

  .conversation-item:hover .delete-conversation-btn {
    opacity: 1;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .messages-container {
    border-radius: 0;
    margin: 0;
    height: 100vh;
  }

  /* 移动端默认显示会话列表 */
  .conversations-sidebar {
    flex: none;
    width: 100%;
    border-radius: 0;
  }

  .conversations-sidebar.hidden {
    display: none;
  }

  /* 移动端聊天区域默认隐藏 */
  .chat-area {
    display: none;
    border-radius: 0;
  }

  .chat-area.show {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 70px; /* 为底部导航栏留空间 */
    z-index: 100;
  }

  /* 返回按钮 */
  .btn-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    cursor: pointer;
    margin-right: 12px;
    transition: all 0.3s;
  }

  .btn-back:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .btn-back svg {
    width: 20px;
    height: 20px;
    color: #333;
  }

  /* 调整头部 */
  .chat-header {
    padding: 12px 16px;
  }

  .chat-header .user-info {
    gap: 10px;
  }

  .chat-header .avatar {
    width: 36px;
    height: 36px;
  }

  .chat-header .name {
    font-size: 15px;
  }

  .chat-header .product-name {
    font-size: 12px;
  }

  .chat-header .btn-link {
    font-size: 13px;
    padding: 6px 12px;
  }

  /* 调整消息列表 */
  .messages-list {
    padding: 16px 12px;
  }

  .message-item {
    margin-bottom: 16px;
  }

  .message-avatar img {
    width: 32px;
    height: 32px;
  }

  .message-content {
    max-width: 80%; /* 移动端进一步增大 */
    min-width: 140px; /* 移动端更大最小宽度 */
  }

  .message-bubble {
    padding: 10px 14px;
    font-size: 15px; /* 保持字体大小 */
    min-width: 120px; /* 移动端气泡更大最小宽度 */
  }

  /* 调整输入框 */
  .input-wrapper {
    padding: 12px;
    gap: 10px;
  }

  /* 移动端删除按钮始终显示 */
  .delete-conversation-btn {
    opacity: 1 !important;
    width: 36px;
    height: 36px;
  }

  .delete-conversation-btn svg {
    width: 18px;
    height: 18px;
  }

  .input-wrapper textarea {
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 12px;
  }

  .btn-send {
    padding: 10px 20px;
    height: 40px;
    font-size: 13px;
    border-radius: 12px;
  }

  /* 会话列表优化 */
  .conversation-item {
    padding: 12px;
  }

  .conversation-item .avatar img {
    width: 46px;
    height: 46px;
  }

  .user-name {
    font-size: 14px;
  }

  .last-message {
    font-size: 12px;
  }

  .product-thumb {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .message-bubble {
    max-width: 75%;
    font-size: 13px;
  }

  .chat-header .name {
    font-size: 14px;
  }

  .input-wrapper textarea {
    font-size: 13px;
  }
}
</style>
