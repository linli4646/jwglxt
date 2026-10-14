<script setup>
import XueshengList from '../components/XueshengList.vue'
import { auth } from '../store/auth'

const readOnly = !['super_admin', 'admin'].includes(auth.user?.role)
</script>

<template>
  <div class="students-page">
    <div class="page-header" style="padding: 0 4px">
      <div>
        <h2 class="page-title">学生信息</h2>
        <p class="page-sub">
          {{ readOnly ? '当前角色仅可查看学生信息' : '管理学生基础信息，数据来自 Supabase' }}
        </p>
      </div>
    </div>
    <XueshengList :read-only="readOnly" />
  </div>
</template>

<style scoped>
.students-page { padding: 4px 20px 20px; }
</style>
