<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { getSettings, saveSettings, resetDatabase, writeLog } from '../api/db'
import { refreshUser } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const form = ref({ systemName: '', subTitle: '', footerText: '', allowReset: 1 })

async function load() {
  loading.value = true
  try {
    form.value = await getSettings()
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!form.value.systemName) {
    ElMessage.warning('系统名称不能为空')
    return
  }
  saving.value = true
  try {
    await saveSettings(form.value)
    writeLog('修改', `修改系统设置（系统名称：${form.value.systemName}）`)
    ElMessage.success('设置已保存，刷新后生效')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '将清空所有业务数据并恢复初始演示数据（用户、角色、菜单、班级、课程、公告、日志），确定继续吗？',
      '恢复默认数据',
      { type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  await resetDatabase()
  refreshUser()
  ElMessage.success('已恢复默认数据，请重新登录')
  // 数据已重置，当前会话可能失效，引导重新登录
  setTimeout(() => location.reload(), 800)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">系统设置</h2>
        <p class="page-sub">配置系统全局信息与演示数据维护</p>
      </div>
    </div>

    <div class="settings-grid">
      <el-card class="plain-card" shadow="never">
        <template #header>
          <div class="panel-title"><el-icon><Icons.Setting /></el-icon> 基本设置</div>
        </template>
        <el-skeleton v-if="loading" animated :rows="4" />
        <el-form v-else :model="form" label-width="90px" style="max-width: 520px">
          <el-form-item label="系统名称">
            <el-input v-model="form.systemName" placeholder="教务管理系统" />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="form.subTitle" placeholder="Educational Administration Management System" />
          </el-form-item>
          <el-form-item label="页脚文案">
            <el-input v-model="form.footerText" placeholder="页脚版权信息" />
          </el-form-item>
          <el-form-item>
            <el-button v-perm="'setting:edit'" type="primary" round :loading="saving" @click="handleSave">保存设置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="plain-card" shadow="never">
        <template #header>
          <div class="panel-title"><el-icon><Icons.Warning /></el-icon> 数据维护</div>
        </template>
        <div class="danger-zone">
          <div class="danger-text">
            <h4>恢复默认演示数据</h4>
            <p>清空当前所有本地业务数据（用户、班级、课程、公告、日志等），并重新写入初始演示数据。课堂演示后可用于一键还原。</p>
          </div>
          <el-button v-perm="'setting:edit'" type="danger" round plain @click="handleReset">恢复默认数据</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
@media (max-width: 1000px) { .settings-grid { grid-template-columns: 1fr; } }

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}
.danger-zone { padding: 6px 2px; }
.danger-text h4 { margin: 0 0 6px; font-size: 14px; color: var(--text-h); }
.danger-text p { margin: 0 0 16px; font-size: 13px; color: var(--text-light); line-height: 1.8; }
</style>
