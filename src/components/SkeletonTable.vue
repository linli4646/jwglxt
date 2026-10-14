<script setup>
// 表格骨架屏：模拟“表头 + 多行数据”的占位结构，配合微光动画
defineProps({
  rows: { type: Number, default: 5 },
  cols: { type: Number, default: 4 }
})
</script>

<template>
  <div class="skeleton-table" aria-hidden="true">
    <div class="row head">
      <div v-for="i in cols" :key="'h' + i" class="skeleton-block" style="height: 14px" :style="{ width: (100 / cols - 4) + '%' }" />
    </div>
    <div v-for="r in rows" :key="r" class="row">
      <div v-for="i in cols" :key="i" class="skeleton-block" style="height: 12px" :style="{ width: (100 / cols - 4 - (i === cols ? 8 : 0)) + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-table {
  padding: 8px 4px;
}
.row {
  display: flex;
  gap: 4%;
  margin-bottom: 22px;
}
.row.head {
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
</style>
