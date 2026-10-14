<template>
  <!-- 网页底部：版权信息 -->
  <footer class="footer">© {{ year }} 教务管理系统 · 版权信息</footer>
</template>

<script setup>
// javascript语句
const year = new Date().getFullYear()
</script>

<style scoped>
/* css语句 */
.footer {
  flex-shrink: 0; /* 内容再少也不被压缩 */
  margin-top: auto; /* 始终贴住页面底部 */
  padding: 18px 16px;
  text-align: center;
  font-size: 13px;
  letter-spacing: 1px;
  color: #9aa5b5;
  border-top: 1px solid var(--border);
}
</style>
