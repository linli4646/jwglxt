<script setup>
// 通用空状态：统一的插画 + 标题 + 说明 + 可选操作按钮
defineProps({
  title: { type: String, default: '暂无数据' },
  description: { type: String, default: '这里空空如也，快去添加第一条数据吧' },
  actionText: { type: String, default: '' }
})

defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <svg class="empty-art" viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="115" rx="62" ry="8" fill="#e8eef6" />
      <rect x="46" y="34" width="88" height="64" rx="10" fill="#f2f6fc" stroke="#dbe4f0" stroke-width="2" />
      <rect x="58" y="52" width="64" height="8" rx="4" fill="#dbe4f0" />
      <rect x="58" y="70" width="44" height="8" rx="4" fill="#e6ecf4" />
      <circle cx="120" cy="40" r="14" fill="#dbe4f0" />
      <circle cx="120" cy="40" r="4" fill="#ffffff" />
      <path d="M100 20 L107 33 L100 46 L93 33 Z" fill="#c3d2e6" />
    </svg>
    <p class="empty-title">{{ title }}</p>
    <p class="empty-desc">{{ description }}</p>
    <el-button v-if="actionText" type="primary" round @click="$emit('action')">{{ actionText }}</el-button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  text-align: center;
}
.empty-art {
  width: 170px;
  margin-bottom: 6px;
  opacity: 0.9;
}
.empty-title {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}
.empty-desc {
  margin: 6px 0 16px;
  font-size: 13px;
  color: var(--text-light);
}
</style>
