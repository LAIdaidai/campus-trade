<template>
  <div class="auth-page">
    <div class="container">
      <AuthCard />
    </div>
  </div>
</template>

<script setup>
import AuthCard from '@/components/AuthCard.vue'
</script>

<style scoped>
/* Styles for AuthView (moved from src/css/AuthView.css) */
.auth-page { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  min-height: 100vh; 
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
  padding: 20px; 
}
.container { 
  width: 100%; 
  max-width: 900px; 
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .auth-page {
    padding: 20px 15px;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 15px 10px;
    align-items: center;
    justify-content: center;
  }
  
  .container {
    max-width: 100%;
  }
}

/* iPad竖屏优化 */
@media (min-width: 481px) and (max-width: 1024px) and (orientation: portrait) {
  .auth-page {
    padding: 30px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .container {
    max-width: 700px;
    margin: 0 auto;
  }
}

/* iPad Pro竖屏特殊优化 */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .auth-page {
    padding: 40px 30px;
  }
  
  .container {
    max-width: 750px;
  }
}
</style>
