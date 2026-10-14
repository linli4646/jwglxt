<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getAttendance, saveAttendance, deleteAttendance, getCourses, getClasses, writeLog } from '../api/db'
import { getAllStudents } from '../api/xuesheng'
import { auth, hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const records = ref([])
const courses = ref([])
const classes = ref([])
const students = ref([])
const dialogVisible = ref(false)
const form = ref({})
const search = ref({ courseId: '', classId: '' })
const statusOptions = ['出勤', '迟到', '早退', '缺勤', '请假']

const isStudent = computed(() => auth.user?.role === 'student')
const isTeacher = computed(() => auth.user?.role === 'teacher')
const courseMap = computed(() => Object.fromEntries(courses.value.map((c) => [c.id, c])))
const classMap = computed(() => Object.fromEntries(classes.value.map((c) => [c.id, c.name])))
const courseOptions = computed(() => courses.value.filter((c) => isTeacher.value ? c.teacher === auth.user.account : true))
const classOptions = computed(() => {
  const course = courseMap.value[form.value.courseId]
  return course ? classes.value.filter((c) => (course.classes || []).includes(c.id)) : classes.value
})
const classStudents = computed(() => students.value.filter((s) => s.class === form.value.classId))

const filtered = computed(() => {
  let list = records.value
  if (isTeacher.value) {
    const ids = courseOptions.value.map((c) => c.id)
    list = list.filter((r) => ids.includes(r.courseId))
  }
  if (isStudent.value) list = list.filter((r) => (r.records || []).some((x) => x.studentId === auth.user?.id || x.studentName === auth.user?.name))
  if (search.value.courseId) list = list.filter((r) => r.courseId === search.value.courseId)
  if (search.value.classId) list = list.filter((r) => r.classId === search.value.classId)
  return list
})
const mySummary = computed(() => {
  const map = Object.fromEntries(statusOptions.map((s) => [s, 0]))
  filtered.value.forEach((r) => {
    ;(r.records || []).forEach((item) => {
      if (!isStudent.value || item.studentId === auth.user?.id || item.studentName === auth.user?.name) map[item.status] = (map[item.status] || 0) + 1
    })
  })
  return map
})

function statusType(status) {
  return status === '出勤' ? 'success' : status === '缺勤' ? 'danger' : status === '请假' ? 'info' : 'warning'
}

function openAdd() {
  form.value = { courseId: '', classId: '', date: new Date().toISOString().slice(0, 10), lesson: '第 1-2 节', records: [] }
  dialogVisible.value = true
}

function openEdit(row) {
  form.value = { ...row, records: (row.records || []).map((r) => ({ ...r })) }
  dialogVisible.value = true
}

function fillStudents() {
  form.value.records = classStudents.value.map((s) => {
    const old = (form.value.records || []).find((r) => r.studentId === s.id)
    return old || { studentId: s.id, studentName: s.name, status: '出勤' }
  })
}

async function handleSave() {
  const f = form.value
  if (!f.courseId || !f.classId || !f.date || !f.records?.length) {
    ElMessage.warning('请完整选择课程、班级、日期并生成学生名单')
    return
  }
  saving.value = true
  try {
    await saveAttendance(f)
    writeLog(f.id ? '修改' : '新增', `${f.id ? '修改' : '发布'}考勤「${courseMap.value[f.courseId]?.name || ''}」`)
    ElMessage.success('考勤已保存')
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
    await ElMessageBox.confirm('确定删除这条考勤记录吗？', '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteAttendance(row.id)
  writeLog('删除', `删除考勤记录「${courseMap.value[row.courseId]?.name || ''}」`)
  ElMessage.success('删除成功')
  await load()
}

function exportCsv() {
  const rows = [['日期', '节次', '课程', '班级', '学生', '状态']]
  filtered.value.forEach((r) => (r.records || []).forEach((item) => rows.push([r.date, r.lesson, courseMap.value[r.courseId]?.name || '', classMap.value[r.classId] || '', item.studentName, item.status])))
  const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '考勤导出.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

async function load() {
  loading.value = true
  try {
    const [a, c, cl, s] = await Promise.all([getAttendance(), getCourses(), getClasses(), getAllStudents().catch(() => ({ data: [] }))])
    records.value = a
    courses.value = c
    classes.value = cl
    students.value = s.data
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
        <h2 class="page-title">{{ isStudent ? '考勤查询' : '考勤管理' }}</h2>
        <p class="page-sub">{{ isStudent ? '查看本人课程考勤状态统计' : '按课程班级发布考勤，支持状态维护与导出' }}</p>
      </div>
      <div class="header-actions">
        <el-button v-if="hasPerm('attendance:export')" round :icon="Icons.Download" @click="exportCsv">导出</el-button>
        <el-button v-perm="'attendance:add'" type="primary" round @click="openAdd"><el-icon><Icons.Plus /></el-icon>发布考勤</el-button>
      </div>
    </div>

    <div class="summary-grid">
      <el-card v-for="s in statusOptions" :key="s" class="plain-card" shadow="never">
        <div class="summary-value">{{ mySummary[s] || 0 }}</div>
        <div class="summary-label">{{ s }}</div>
      </el-card>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <el-select v-model="search.courseId" placeholder="全部课程" clearable style="width: 190px">
          <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-if="!isStudent" v-model="search.classId" placeholder="全部班级" clearable style="width: 180px">
          <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>

      <SkeletonTable v-if="loading" :rows="5" :cols="5" />
      <el-table v-else :data="filtered" style="width: 100%">
        <el-table-column prop="date" label="日期" width="120" align="center" />
        <el-table-column prop="lesson" label="节次" width="110" align="center" />
        <el-table-column label="课程" min-width="170"><template #default="{ row }">{{ courseMap[row.courseId]?.name || '未知课程' }}</template></el-table-column>
        <el-table-column label="班级" min-width="160"><template #default="{ row }">{{ classMap[row.classId] || '未分班' }}</template></el-table-column>
        <el-table-column label="考勤概览" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="item in (isStudent ? row.records.filter((x) => x.studentId === auth.user?.id || x.studentName === auth.user?.name) : row.records)" :key="item.studentId" round :type="statusType(item.status)">
                {{ item.studentName }}：{{ item.status }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column v-if="!isStudent" label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button v-perm="'attendance:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
            <el-button v-perm="'attendance:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState title="暂无考勤" description="发布考勤后会在这里显示" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="考勤记录" width="680px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="课程" required>
          <el-select v-model="form.courseId" placeholder="选择课程" style="width: 100%">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级" required>
          <el-select v-model="form.classId" placeholder="选择班级" style="width: 100%">
            <el-option v-for="c in classOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期/节次">
          <div class="inline-row">
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="flex: 1" />
            <el-input v-model="form.lesson" placeholder="如：第 1-2 节" style="flex: 1" />
            <el-button round @click="fillStudents">生成名单</el-button>
          </div>
        </el-form-item>
      </el-form>

      <el-table :data="form.records || []" max-height="320" style="width: 100%">
        <el-table-column prop="studentName" label="学生" min-width="120" />
        <el-table-column label="状态" width="180" align="center">
          <template #default="{ row }">
            <el-select v-model="row.status" size="small">
              <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
            </el-select>
          </template>
        </el-table-column>
        <template #empty><EmptyState title="暂无名单" description="选择班级后点击生成名单" /></template>
      </el-table>

      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.header-actions { display: flex; gap: 10px; }
.summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 18px; }
.summary-value { font-size: 24px; font-weight: 700; color: var(--text-h); }
.summary-label { font-size: 13px; color: var(--text-light); }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.inline-row { display: flex; gap: 10px; width: 100%; }
@media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
