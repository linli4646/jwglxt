<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getNotices, addNotice, updateNotice, deleteNotice, writeLog } from '../api/db'
import { auth, hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const notices = ref([])

const isManager = computed(() => ['super_admin', 'admin'].includes(auth.user?.role))

const search = ref({ keyword: '', type: '' })
const page = ref(1)
const pageSize = ref(8)

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

const detailVisible = ref(false)
const detail = ref(null)

const typeOptions = ['教务通知', '考试安排', '放假通知', '其他']

const filtered = computed(() => {
  // 教师/学生只看公开公告，管理员看全部
  let list = isManager.value ? notices.value : notices.value.filter((n) => n.status === 1)
  const kw = search.value.keyword.trim().toLowerCase()
  if (kw) list = list.filter((n) => n.title.toLowerCase().includes(kw) || n.content.toLowerCase().includes(kw))
  if (search.value.type) list = list.filter((n) => n.type === search.value.type)
  // 置顶优先，再按发布时间倒序
  return [...list].sort((a, b) => (b.top - a.top) || (b.publishTime || '').localeCompare(a.publishTime || ''))
})
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function resetSearch() {
  search.value = { keyword: '', type: '' }
  page.value = 1
}

function openAdd() {
  isEdit.value = false
  form.value = { title: '', type: '教务通知', content: '', top: 0, status: 1, publishTime: '' }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

function openDetail(row) {
  detail.value = row
  detailVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.title || !f.content) {
    ElMessage.warning('请填写公告标题和内容')
    return
  }
  saving.value = true
  try {
    const data = {
      title: f.title,
      type: f.type,
      content: f.content,
      top: f.top ? 1 : 0,
      status: f.status,
      publishTime: f.publishTime || new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    }
    if (isEdit.value) {
      await updateNotice(f.id, data)
      writeLog('修改', `编辑公告「${f.title}」`)
      ElMessage.success('保存成功')
    } else {
      await addNotice({ ...data, author: auth.user.account })
      writeLog('发布', `发布公告「${f.title}」`)
      ElMessage.success('发布成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除公告「${row.title}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteNotice(row.id)
  writeLog('删除', `删除公告「${row.title}」`)
  ElMessage.success('删除成功')
  await load()
}

async function toggleTop(row) {
  await updateNotice(row.id, { top: row.top ? 0 : 1 })
  writeLog('修改', `${row.top ? '取消置顶' : '置顶'}公告「${row.title}」`)
  ElMessage.success(row.top ? '已取消置顶' : '已置顶')
  await load()
}

async function load() {
  loading.value = true
  try {
    notices.value = await getNotices()
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
        <h2 class="page-title">{{ isManager ? '公告管理' : '公告中心' }}</h2>
        <p class="page-sub">{{ isManager ? '发布教务通知、考试安排等，支持置顶与公开/隐藏' : '查看学校发布的最新教务通知' }}</p>
      </div>
      <el-button v-perm="'notice:add'" type="primary" round @click="openAdd">
        <el-icon style="margin-right: 6px"><Icons.Promotion /></el-icon>发布公告
      </el-button>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search.keyword" placeholder="按标题 / 内容搜索" clearable style="width: 240px">
            <template #prefix><el-icon><Icons.Search /></el-icon></template>
          </el-input>
          <el-select v-model="search.type" placeholder="全部类型" clearable style="width: 140px">
            <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
          </el-select>
          <el-button type="primary" round @click="page = 1">查询</el-button>
          <el-button round @click="resetSearch">重置</el-button>
        </div>
      </div>

      <SkeletonTable v-if="loading" :rows="5" :cols="5" />
      <template v-else>
        <el-table :data="paged" style="width: 100%">
          <el-table-column label="标题" min-width="280">
            <template #default="{ row }">
              <div class="title-cell" @click="openDetail(row)">
                <span v-if="row.top" class="top-flag"><el-icon><Icons.Top /></el-icon>顶</span>
                <span class="title-text">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="110" align="center">
            <template #default="{ row }">
              <el-tag round effect="light" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publishTime" label="发布时间" width="170" align="center" />
          <el-table-column label="展示状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag round size="small" effect="plain" :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '公开' : '隐藏' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="isManager" label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button v-perm="'notice:top'" size="small" round :type="row.top ? 'warning' : 'primary'" plain @click="toggleTop(row)">
                  {{ row.top ? '取消置顶' : '置顶' }}
                </el-button>
                <el-button v-perm="'notice:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
                <el-button v-perm="'notice:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState title="暂无公告" :description="search.keyword || search.type ? '换个筛选条件试试' : '还没有发布任何公告'" />
          </template>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filtered.length"
            :page-sizes="[8, 15, 30]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </template>
    </el-card>

    <!-- 公告详情 -->
    <el-dialog v-model="detailVisible" :title="detail?.title" width="560px">
      <div class="detail-meta">
        <el-tag round effect="light" size="small">{{ detail?.type }}</el-tag>
        <span>{{ detail?.publishTime }}</span>
        <span>发布人：{{ detail?.author || '管理员' }}</span>
      </div>
      <div class="detail-content">{{ detail?.content }}</div>
    </el-dialog>

    <!-- 发布/编辑公告 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="公告标题" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="公告内容" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="form.publishTime"
            type="datetime"
            placeholder="选择发布时间（留空为当前时间）"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="展示状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">公开</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.top" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '发布' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 18px; }
.toolbar-left { display: flex; gap: 10px; flex-wrap: wrap; }

.title-cell { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.title-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-h);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.title-cell:hover .title-text { color: var(--primary); }
.top-flag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 8px;
  flex-shrink: 0;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #f56c6c, #ff9f43);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  font-size: 12.5px;
  color: var(--text-light);
  border-bottom: 1px dashed var(--border);
}
.detail-content {
  font-size: 14px;
  line-height: 1.9;
  color: #3d4756;
  white-space: pre-wrap;
}

.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
.action-buttons {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}
.action-buttons :deep(.el-button + .el-button) { margin-left: 0; }
</style>
