<template>
  <!-- html文件 -->
  <!-- 页面主体：撑满剩余高度，让页脚始终贴底 -->
  <div class="helloworld">
    <!-- 顶部横幅：渐变背景 + 主副标题。
         上方留白 margin-top 和大内边距同时解决了“标题贴住窗口顶端、看着像被裁掉”的问题 -->
    <header class="banner">
      <h1 class="banner-title">教务管理系统</h1>
      <p class="banner-sub">Educational Administration Management System</p>
    </header>

    <!-- 学生信息表：数据来自 Supabase 的 xuesheng 表，支持增删改查 -->
    <XueshengList />
  </div>
</template>

<script setup>
// javascript语句
import XueshengList from './XueshengList.vue'
</script>

<style scoped>
/* css语句 */
.helloworld {
  flex: 1 0 auto; /* 占据页脚以外的全部高度 */
}

.banner {
  margin: 24px 16px 0;
  padding: 42px 24px 38px;
  border-radius: 14px;
  text-align: center;
  color: #fff;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 55%, #1b87db 100%);
  box-shadow: var(--shadow);
}

.banner-title {
  margin: 0;
  font-size: 38px;
  font-weight: 600;
  letter-spacing: 8px; /* 中文字距拉开更有标题感 */
  text-indent: 8px;    /* 抵消最后一个字的字距，保证视觉居中 */
}

.banner-sub {
  margin: 10px 0 0;
  font-size: 13px;
  letter-spacing: 2px;
  opacity: 0.72;
}

@media (max-width: 768px) {
  .banner {
    margin: 12px 10px 0;
    padding: 30px 16px 26px;
  }
  .banner-title {
    font-size: 28px;
    letter-spacing: 4px;
    text-indent: 4px;
  }
}
</style>
