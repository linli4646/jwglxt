<script setup>
import * as Icons from '@element-plus/icons-vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: 'DataLine' },
  color: { type: String, default: '#1b87db' },
  loading: { type: Boolean, default: false },
  suffix: { type: String, default: '' }
})

function iconOf(name) {
  return Icons[name] || Icons.DataLine
}
</script>

<template>
  <el-card class="stat-card card-hover" shadow="never">
    <template v-if="loading">
      <el-skeleton animated :rows="2" />
    </template>
    <template v-else>
      <div class="stat-body">
        <div class="stat-icon" :style="{ background: color + '1a', color }">
          <el-icon :size="24"><component :is="iconOf(icon)" /></el-icon>
        </div>
        <div class="stat-meta">
          <div class="stat-value">
            {{ value }}<span v-if="suffix" class="stat-suffix">{{ suffix }}</span>
          </div>
          <div class="stat-label">{{ label }}</div>
        </div>
      </div>
    </template>
  </el-card>
</template>

<style scoped>
.stat-card { cursor: default; }
.stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 2px;
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 14px;
  transition: transform 0.3s ease;
}
.stat-card:hover .stat-icon { transform: scale(1.08) rotate(-4deg); }
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-h);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.stat-suffix {
  margin-left: 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-light);
}
.stat-label {
  margin-top: 2px;
  font-size: 13px;
  color: var(--text-light);
}
</style>
