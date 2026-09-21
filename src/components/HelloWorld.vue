<template>
  <!-- html文件 -->
  <!-- Vue3 虽支持多根节点(Fragment)，但建议使用单根容器包裹，便于统一样式与结构扩展 -->
  <div class="helloworld">
    <!-- 原内联样式 font-size:40px 抽取为下面的 .app-title 类，便于复用与维护 -->
    <div class="mytitle">教务管理系统</div>
    <el-button>按钮</el-button>
<el-input />
    <!-- 以下为演示占位内容，后续可替换为真实业务内容 -->
    <h1>dddd</h1>
    <p>4444</p>
  </div>
</template>

<script setup>
// javascript语句
// Vue3 推荐使用 <script setup> 写法；如需公共样式，可在此引入：
// import '../css/common.css'（本组件位于 src/components/ 下）
</script>

<style scoped>
/* css语句 */
@import "../css/common.css";
</style>
