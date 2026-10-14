<script setup>
import { useRouter } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-code">403</div>
    <div class="error-icon"><el-icon><Icons.Lock /></el-icon></div>
    <h2>无权限访问</h2>
    <p>你当前的账号角色没有权限访问该页面</p>
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
  background: linear-gradient(135deg, #1b87db, #5b7cfa);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.error-icon { font-size: 40px; color: var(--primary); margin: 16px 0; }
.error-page h2 { margin: 0 0 8px; color: var(--text-h); }
.error-page p { margin: 0 0 24px; color: var(--text-light); }
</style>
