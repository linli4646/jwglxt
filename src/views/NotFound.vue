<script setup>
import { useRouter } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-code">404</div>
    <div class="error-icon"><el-icon><Icons.Search /></el-icon></div>
    <h2>页面不存在</h2>
    <p>你访问的页面可能已被删除或地址有误</p>
    <el-button type="primary" round @click="router.replace('/dashboard')">返回首页</el-button>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  color: var(--text);
}
.error-code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #ff9f43, #f56c6c);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.error-icon { font-size: 40px; color: #ff9f43; margin: 16px 0; }
.error-page h2 { margin: 0 0 8px; color: var(--text-h); }
.error-page p { margin: 0 0 24px; color: var(--text-light); }
</style>
