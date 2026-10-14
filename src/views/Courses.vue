<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getCourses, addCourse, updateCourse, deleteCourse, getUsers, getClasses, writeLog } from '../api/db'
import { hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const courses = ref([])
const teachers = ref([])
const classes = ref([])

const search = ref({ keyword: '', type: '' })
const page = ref(1)
const pageSize = ref(8)

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

const teacherName = computed(() => {
  const map = {}
  teachers.value.forEach((t) => (map[t.account] = t.name))
  return (account) => map[account] || '待分配'
})

const className = computed(() => {
  const map = {}
  classes.value.forEach((c) => (map[c.id] = c.name))
  return (ids) => (ids || []).map((id) => map[id] || `班级 ${id}`).join('、') || '未分配'
})

const filtered = computed(() => {
  let list = courses.value
  const kw = search.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.code.toLowerCase().includes(kw) ||
        teacherName(c.teacher).toLowerCase().includes(kw)
    )
  }
  if (search.value.type) list = list.filter((c) => c.type === search.value.type)
  return list
})
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function resetSearch() {
  search.value = { keyword: '', type: '' }
  page.value = 1
}

function openAdd() {
  isEdit.value = false
  form.value = { name: '', code: '', type: '必修', credit: 2, hours: 32, teacher: null, classes: [], time: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row, classes: [...(row.classes || [])] }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.name || !f.code) {
    ElMessage.warning('请填写课程名称和课程编号')
    return
  }
  saving.value = true
  try {
    const data = { name: f.name, code: f.code, type: f.type, credit: f.credit, hours: f.hours, teacher: f.teacher, classes: f.classes, time: f.time, status: f.status }
    if (isEdit.value) {
      await updateCourse(f.id, data)
      writeLog('修改', `修改课程「${f.name}」`)
      ElMessage.success('保存成功')
    } else {
      await addCourse(data)
      writeLog('新增', `新增课程「${f.name}」`)
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
    await ElMessageBox.confirm(`确定删除课程「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteCourse(row.id)
  writeLog('删除', `删除课程「${row.name}」`)
  ElMessage.success('删除成功')
  await load()
}

async function toggleStatus(row) {
  try {
    await ElMessageBox.confirm(`确定${row.status === 1 ? '下架' : '上架'}课程「${row.name}」吗？`, '操作确认', { type: 'warning' })
  } catch {
    return
  }
  await updateCourse(row.id, { status: row.status === 1 ? 0 : 1 })
  writeLog('修改', `${row.status === 1 ? '下架' : '上架'}课程「${row.name}」`)
  ElMessage.success('操作成功')
  await load()
}

async function load() {
  loading.value = true
  try {
    const [c, u, cl] = await Promise.all([getCourses(), getUsers(), getClasses()])
    courses.value = c
    teachers.value = u.filter((x) => x.role === 'teacher')
    classes.value = cl
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
        <h2 class="page-title">课程管理</h2>
        <p class="page-sub">维护课程信息，为课程匹配授课教师与授课班级</p>
      </div>
      <el-button v-perm="'course:add'" type="primary" round @click="openAdd">
        <el-icon style="margin-right: 6px"><Icons.Plus /></el-icon>添加课程
      </el-button>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search.keyword" placeholder="按课程名称 / 编号 / 教师搜索" clearable style="width: 260px">
            <template #prefix><el-icon><Icons.Search /></el-icon></template>
          </el-input>
          <el-select v-model="search.type" placeholder="全部类型" clearable style="width: 130px">
            <el-option label="必修" value="必修" />
            <el-option label="选修" value="选修" />
          </el-select>
          <el-button type="primary" round @click="page = 1">查询</el-button>
          <el-button round @click="resetSearch">重置</el-button>
        </div>
      </div>

      <SkeletonTable v-if="loading" :rows="5" :cols="5" />
      <template v-else>
        <el-table :data="paged" style="width: 100%">
          <el-table-column label="课程" min-width="190">
            <template #default="{ row }">
              <div class="name-cell">
                <span class="course-badge"><el-icon :size="18"><Icons.Reading /></el-icon></span>
                <div>
                  <div class="cell-name">{{ row.name }}</div>
                  <div class="cell-sub">编号：{{ row.code }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag round effect="light" size="small" :type="row.type === '必修' ? 'danger' : 'primary'">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="学分 / 课时" width="120" align="center">
            <template #default="{ row }">
              <span class="count">{{ row.credit }}</span><span class="cell-sub"> 学分 · </span>
              <span class="count">{{ row.hours }}</span><span class="cell-sub"> 课时</span>
            </template>
          </el-table-column>
          <el-table-column label="授课教师" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.teacher" round effect="plain" size="small">{{ teacherName(row.teacher) }}</el-tag>
              <span v-else class="cell-sub">待分配</span>
            </template>
          </el-table-column>
          <el-table-column label="授课班级" min-width="160">
            <template #default="{ row }">
              <span class="class-text">{{ className(row.classes) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                :disabled="!hasPerm('course:edit')"
                @change="toggleStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button v-perm="'course:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
              <el-button v-perm="'course:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState title="暂无课程" :description="search.keyword || search.type ? '换个筛选条件试试' : '点击右上角「添加课程」创建第一门课程'" />
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

    <!-- 添加/编辑课程 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑课程' : '添加课程'" width="500px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="课程名称" required>
          <el-input v-model="form.name" placeholder="如：Web 前端框架技术" />
        </el-form-item>
        <el-form-item label="课程编号" required>
          <el-input v-model="form.code" placeholder="如：CS2401" />
        </el-form-item>
        <el-form-item label="课程类型" required>
          <el-radio-group v-model="form.type">
            <el-radio value="必修">必修</el-radio>
            <el-radio value="选修">选修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="学分 / 课时">
          <div style="display: flex; gap: 10px; width: 100%">
            <el-input-number v-model="form.credit" :min="0.5" :max="10" :step="0.5" style="flex: 1" />
            <el-input-number v-model="form.hours" :min="1" :max="200" style="flex: 1" />
          </div>
        </el-form-item>
        <el-form-item label="授课教师">
          <el-select v-model="form.teacher" placeholder="选择授课教师" clearable style="width: 100%">
            <el-option v-for="t in teachers" :key="t.account" :label="`${t.name}（${t.account}）`" :value="t.account" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课班级">
          <el-select v-model="form.classes" multiple placeholder="选择授课班级" style="width: 100%">
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课时间">
          <el-input v-model="form.time" placeholder="如：周一 1-2 节" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">开课</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 18px; }
.toolbar-left { display: flex; gap: 10px; flex-wrap: wrap; }

.name-cell { display: flex; align-items: center; gap: 12px; }
.course-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: #ff9f43;
  background: rgba(255, 159, 67, 0.12);
}
.cell-name { font-size: 14px; font-weight: 600; color: var(--text-h); line-height: 1.3; }
.cell-sub { font-size: 12px; color: var(--text-light); }
.count { font-weight: 600; color: var(--text-h); }
.class-text { font-size: 12.5px; color: #5b6675; }

.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
</style>
