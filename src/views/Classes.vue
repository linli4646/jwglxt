<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getClasses, addClass, updateClass, deleteClass, getUsers, writeLog } from '../api/db'
import { getAllStudents, updateStudent } from '../api/xuesheng'
import { hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const classes = ref([])
const teachers = ref([])
const studentCounts = ref({}) // 班级实际人数（来自 Supabase 学生表）

const search = ref({ keyword: '', year: '', status: '' })
const page = ref(1)
const pageSize = ref(8)

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

// 分配学生弹窗
const assignVisible = ref(false)
const assignClass = ref(null)
const assignLoading = ref(false)
const assignSaving = ref(false)
const allStudents = ref([])
const selectedIds = ref([])
const assignTableRef = ref(null)

const teacherName = computed(() => {
  const map = {}
  teachers.value.forEach((t) => (map[t.account] = t.name))
  return (account) => map[account] || '未分配'
})

const filtered = computed(() => {
  let list = classes.value
  const kw = search.value.keyword.trim().toLowerCase()
  if (kw) list = list.filter((c) => c.name.toLowerCase().includes(kw) || c.major.toLowerCase().includes(kw))
  if (search.value.year) list = list.filter((c) => c.year === search.value.year)
  if (search.value.status !== '') list = list.filter((c) => c.status === search.value.status)
  return list
})
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const yearOptions = computed(() => [...new Set(classes.value.map((c) => c.year))].sort())

function resetSearch() {
  search.value = { keyword: '', year: '', status: '' }
  page.value = 1
}

function openAdd() {
  isEdit.value = false
  form.value = { name: '', major: '', year: new Date().getFullYear(), count: 0, counselor: null, status: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.name || !f.major || !f.year) {
    ElMessage.warning('请填写班级名称、专业和入学年份')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateClass(f.id, { name: f.name, major: f.major, year: f.year, count: f.count, counselor: f.counselor, status: f.status })
      writeLog('修改', `修改班级「${f.name}」`)
      ElMessage.success('保存成功')
    } else {
      await addClass({ name: f.name, major: f.major, year: f.year, count: f.count, counselor: f.counselor, status: f.status })
      writeLog('新增', `新增班级「${f.name}」`)
      ElMessage.success('添加成功')
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
    await ElMessageBox.confirm(`确定删除班级「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteClass(row.id)
  writeLog('删除', `删除班级「${row.name}」`)
  ElMessage.success('删除成功')
  await load()
}

async function toggleStatus(row) {
  try {
    await ElMessageBox.confirm(`确定${row.status === 1 ? '停用' : '启用'}班级「${row.name}」吗？`, '操作确认', { type: 'warning' })
  } catch {
    return
  }
  await updateClass(row.id, { status: row.status === 1 ? 0 : 1 })
  writeLog('修改', `${row.status === 1 ? '停用' : '启用'}班级「${row.name}」`)
  ElMessage.success('操作成功')
  await load()
}

/* ---------- 批量分配学生 ---------- */
async function openAssign(row) {
  assignClass.value = row
  assignVisible.value = true
  assignLoading.value = true
  selectedIds.value = []
  try {
    const { data } = await getAllStudents()
    allStudents.value = data
    selectedIds.value = data.filter((s) => s.class === row.id).map((s) => s.id)
    // 回显已分配学生的勾选状态（等待表格渲染完成后再勾选）
    nextTick(() => {
      data.forEach((s) => {
        if (selectedIds.value.includes(s.id)) assignTableRef.value?.toggleRowSelection(s, true)
      })
    })
  } catch (e) {
    ElMessage.warning('学生数据加载失败（Supabase 不可用），仅能查看已分配列表')
    allStudents.value = []
  } finally {
    assignLoading.value = false
  }
}

async function handleAssign() {
  if (!allStudents.value.length) {
    ElMessage.warning('无法连接学生数据源')
    return
  }
  assignSaving.value = true
  try {
    const ids = new Set(selectedIds.value)
    for (const s of allStudents.value) {
      const target = ids.has(s.id) ? assignClass.value.id : null
      if (s.class !== target) {
        await updateStudent(s.id, { class: target })
      }
    }
    writeLog('修改', `为班级「${assignClass.value.name}」批量分配学生 ${ids.size} 人`)
    ElMessage.success('分配完成')
    assignVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error('分配失败：' + (e.response?.data?.message || e.message))
  } finally {
    assignSaving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const [c, u] = await Promise.all([getClasses(), getUsers()])
    classes.value = c
    teachers.value = u.filter((x) => x.role === 'teacher' || x.role === 'admin')
    // 尝试统计各班级实际学生人数
    try {
      const { data } = await getAllStudents()
      const map = {}
      data.forEach((s) => {
        if (s.class !== null && s.class !== undefined) map[s.class] = (map[s.class] || 0) + 1
      })
      studentCounts.value = map
    } catch (e) {
      studentCounts.value = {}
    }
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
        <h2 class="page-title">班级管理</h2>
        <p class="page-sub">维护班级信息，绑定辅导员并批量分配班级学生</p>
      </div>
      <el-button v-perm="'class:add'" type="primary" round @click="openAdd">
        <el-icon style="margin-right: 6px"><Icons.Plus /></el-icon>添加班级
      </el-button>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search.keyword" placeholder="按班级名称 / 专业搜索" clearable style="width: 240px">
            <template #prefix><el-icon><Icons.Search /></el-icon></template>
          </el-input>
          <el-select v-model="search.year" placeholder="全部年份" clearable style="width: 130px">
            <el-option v-for="y in yearOptions" :key="y" :label="y + ' 级'" :value="y" />
          </el-select>
          <el-select v-model="search.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
          <el-button type="primary" round @click="page = 1">查询</el-button>
          <el-button round @click="resetSearch">重置</el-button>
        </div>
      </div>

      <SkeletonTable v-if="loading" :rows="5" :cols="5" />
      <template v-else>
        <el-table :data="paged" style="width: 100%">
          <el-table-column label="班级名称" min-width="200">
            <template #default="{ row }">
              <div class="name-cell">
                <span class="class-badge"><el-icon :size="18"><Icons.School /></el-icon></span>
                <div>
                  <div class="cell-name">{{ row.name }}</div>
                  <div class="cell-sub">{{ row.major }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="year" label="入学年份" width="100" align="center">
            <template #default="{ row }">{{ row.year }} 级</template>
          </el-table-column>
          <el-table-column label="人数" width="130" align="center">
            <template #default="{ row }">
              <span class="count">{{ studentCounts[row.id] ?? row.count }}</span>
              <span class="cell-sub"> 人</span>
            </template>
          </el-table-column>
          <el-table-column label="辅导员" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.counselor" round effect="plain" size="small">{{ teacherName(row.counselor) }}</el-tag>
              <span v-else class="cell-sub">未分配</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                :disabled="!hasPerm('class:edit')"
                @change="toggleStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center">
            <template #default="{ row }">
              <el-button v-perm="'class:assign'" size="small" round type="primary" plain @click="openAssign(row)">分配学生</el-button>
              <el-button v-perm="'class:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
              <el-button v-perm="'class:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState title="暂无班级" :description="search.keyword || search.year || search.status !== '' ? '换个筛选条件试试' : '点击右上角「添加班级」创建第一个班级'" />
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

    <!-- 添加/编辑班级 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑班级' : '添加班级'" width="480px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="班级名称" required>
          <el-input v-model="form.name" placeholder="如：软件工程 2401 班" />
        </el-form-item>
        <el-form-item label="所属专业" required>
          <el-input v-model="form.major" placeholder="如：软件工程" />
        </el-form-item>
        <el-form-item label="入学年份" required>
          <el-input-number v-model="form.year" :min="2000" :max="2100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="班级人数">
          <el-input-number v-model="form.count" :min="0" :max="200" style="width: 100%" />
        </el-form-item>
        <el-form-item label="辅导员">
          <el-select v-model="form.counselor" placeholder="选择辅导员" clearable style="width: 100%">
            <el-option v-for="t in teachers" :key="t.account" :label="`${t.name}（${t.account}）`" :value="t.account" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量分配学生 -->
    <el-dialog v-model="assignVisible" :title="`分配学生 · ${assignClass?.name || ''}`" width="640px" destroy-on-close>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="勾选学生即分配到本班级；取消勾选则移出本班级"
        style="margin-bottom: 16px"
      />
      <SkeletonTable v-if="assignLoading" :rows="5" :cols="4" />
      <el-table
        v-else
        ref="assignTableRef"
        :data="allStudents"
        row-key="id"
        max-height="360"
        @selection-change="(v) => (selectedIds = v.map((s) => s.id))"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column prop="id" label="学号" width="90" align="center" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column label="当前班级" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.class" round size="small" effect="plain">{{ row.class }} 班</el-tag>
            <span v-else class="cell-sub">未分班</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center" />
        <template #empty>
          <EmptyState title="暂无学生数据" description="学生数据来自 Supabase，请检查网络或数据表" />
        </template>
      </el-table>
      <template #footer>
        <span class="assign-count">已选 {{ selectedIds.length }} 人</span>
        <el-button round @click="assignVisible = false">取消</el-button>
        <el-button type="primary" round :loading="assignSaving" @click="handleAssign">保存分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 18px; }
.toolbar-left { display: flex; gap: 10px; flex-wrap: wrap; }

.name-cell { display: flex; align-items: center; gap: 12px; }
.class-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: var(--primary);
  background: var(--primary-light);
}
.cell-name { font-size: 14px; font-weight: 600; color: var(--text-h); line-height: 1.3; }
.cell-sub { font-size: 12px; color: var(--text-light); }
.count { font-weight: 600; color: var(--text-h); }

.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
.assign-count { margin-right: auto; font-size: 13px; color: var(--text-light); }
</style>
