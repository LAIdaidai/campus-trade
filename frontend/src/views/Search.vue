<template>
  <div class="page">
    <main class="main-content">
      <div class="search-container">
        <div class="search-header">
          <h2>搜索结果</h2>
          <p class="search-query">关键词: <span>"{{ searchQuery }}"</span></p>
        </div>
        
        <div class="placeholder">
          <div class="icon">🔍</div>
          <h3>搜索功能</h3>
          <p>此功能正在开发中...</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const searchQuery = computed(() => route.query.q || '')
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg-gray);
}

.main-content {
  max-width: 100%;
  margin: 0 20px; /* 左右边距都是20px，和消息页一致 */
  padding: 32px 20px;
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 30px;
}

h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.search-query {
  font-size: 16px;
  color: var(--text-secondary);
}

.search-query span {
  color: var(--primary-color);
  font-weight: 600;
}

.placeholder {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.icon {
  font-size: 80px;
  margin-bottom: 20px;
}

h3 {
  font-size: 24px;
  color: var(--text-primary);
  margin: 0 0 12px;
}

p {
  font-size: 16px;
  color: var(--text-tertiary);
}

/* iPad横屏：统一边距 */
@media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
  .main-content {
    margin: 0 20px; /* 统一为20px，和其他页面一致 */
    padding: 32px 20px;
  }
}

/* iPad竖屏：统一边距 */
@media (max-width: 1024px) and (orientation: portrait) {
  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 20px 16px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    margin: 0; /* 移除左右边距 */
    padding: 20px 12px;
  }
}
</style>
