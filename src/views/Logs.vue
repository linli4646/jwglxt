<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getLogs, clearLogs } from '../api/db'

const loading = ref(true)
const logs = ref([])

const search = ref({ keyword: '', action: '' })
const page = ref(1)
const pageSize = ref(10)

const actionOptions = ['登录', '登出', '新增', '修改', '删除', '发布']

const filtered = computed(() => {
  let list = logs.value
  const kw = search.value.keyword.trim().toLowerCase()
  if (kw) list = list.filter((l) => l.detail.toLowerCase().includes(kw) || l.user.toLowerCase().includes(kw) || l.account.toLowerCase().includes(kw))
  if (search.value.action) list = list.filter((l) => l.action.includes(search.value.action))
  return list
})
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const actionType = (action) => {
  if (action.includes('登录')) return 'success'
  if (action.includes('删除')) return 'danger'
  if (action.includes('新增') || action.includes('发布')) return 'primary'
  if (action.includes('登出')) return 'info'
  return 'warning'
}

function resetSearch() {
  search.value = { keyword: '', action: '' }
  page.value = 1
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空全部操作日志吗？此操作不可恢复。', '清空确认', { type: 'warning' })
  } catch {
    return
  }
  await clearLogs()
  ElMessage.success('日志已清空')
  await load()
}

async function load() {
  loading.value = true
  try {
    logs.value = await getLogs()
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">操作日志</h2>
        <p class="page-sub">记录登录登出与关键业务操作，全流程可审计</p>
      </div>
      <el-button type="danger" plain round :icon="Icons.Delete" @click="handleClear">清空日志</el-button>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <el-input v-model="search.keyword" placeholder="按操作人 / 详情搜索" clearable style="width: 260px">
          <template #prefix><el-icon><Icons.Search /></el-icon></template>
        </el-input>
        <el-select v-model="search.action" placeholder="全部类型" clearable style="width: 140px">
          <el-option v-for="a in actionOptions" :key="a" :label="a" :value="a" />
        </el-select>
        <el-button type="primary" round @click="page = 1">查询</el-button>
        <el-button round @click="resetSearch">重置</el-button>
        <el-button round :icon="Icons.Refresh" @click="load">刷新</el-button>
      </div>

      <SkeletonTable v-if="loading" :rows="6" :cols="4" />
      <template v-else>
        <el-table :data="paged" style="width: 100%">
          <el-table-column label="操作类型" width="110" align="center">
            <template #default="{ row }">
              <el-tag round effect="light" size="small" :type="actionType(row.action)">{{ row.action }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作人" width="140">
            <template #default="{ row }">
              <div class="cell-name">{{ row.user || '系统' }}</div>
              <div class="cell-sub">@{{ row.account || '—' }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="detail" label="操作详情" min-width="300" />
          <el-table-column prop="time" label="时间" width="180" align="center" />
          <template #empty>
            <EmptyState title="暂无日志" :description="search.keyword || search.action ? '换个筛选条件试试' : '系统操作记录会显示在这里'" />
          </template>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filtered.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.cell-name { font-size: 13.5px; font-weight: 600; color: var(--text-h); line-height: 1.3; }
.cell-sub { font-size: 12px; color: var(--text-light); }
.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
</style>
