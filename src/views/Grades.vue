<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getGrades, saveGrade, deleteGrade, getCourses, getClasses, writeLog } from '../api/db'
import { getAllStudents } from '../api/xuesheng'
import { auth, hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const grades = ref([])
const courses = ref([])
const classes = ref([])
const students = ref([])
const form = ref({})
const dialogVisible = ref(false)
const search = ref({ courseId: '', classId: '', term: '' })

const isStudent = computed(() => auth.user?.role === 'student')
const isTeacher = computed(() => auth.user?.role === 'teacher')

const courseMap = computed(() => Object.fromEntries(courses.value.map((c) => [c.id, c])))
const classMap = computed(() => Object.fromEntries(classes.value.map((c) => [c.id, c.name])))
const myCourseIds = computed(() => {
  if (!isTeacher.value) return courses.value.map((c) => c.id)
  return courses.value.filter((c) => c.teacher === auth.user.account).map((c) => c.id)
})
const courseOptions = computed(() => courses.value.filter((c) => isTeacher.value ? c.teacher === auth.user.account : true))
const classOptions = computed(() => {
  const selected = courseMap.value[form.value.courseId]
  if (selected) return classes.value.filter((c) => (selected.classes || []).includes(c.id))
  return classes.value
})
const studentOptions = computed(() => {
  if (!form.value.classId) return students.value
  return students.value.filter((s) => s.class === form.value.classId)
})

const filtered = computed(() => {
  let list = grades.value
  if (isStudent.value) list = list.filter((g) => g.studentId === auth.user?.id || g.studentName === auth.user?.name)
  if (isTeacher.value) list = list.filter((g) => myCourseIds.value.includes(g.courseId))
  if (search.value.courseId) list = list.filter((g) => g.courseId === search.value.courseId)
  if (search.value.classId) list = list.filter((g) => g.classId === search.value.classId)
  if (search.value.term) list = list.filter((g) => g.term === search.value.term)
  return list
})

const avgScore = computed(() => {
  if (!filtered.value.length) return 0
  return Math.round(filtered.value.reduce((sum, g) => sum + Number(g.total || 0), 0) / filtered.value.length)
})
const passRate = computed(() => {
  if (!filtered.value.length) return 0
  return Math.round((filtered.value.filter((g) => Number(g.total) >= 60).length / filtered.value.length) * 100)
})

function openAdd() {
  form.value = { term: '2026-2027-1', courseId: '', classId: '', studentId: '', studentName: '', usual: 0, final: 0 }
  dialogVisible.value = true
}

function openEdit(row) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  const stu = students.value.find((s) => s.id === f.studentId)
  if (!f.term || !f.courseId || !f.classId || !stu) {
    ElMessage.warning('请完整选择学期、课程、班级和学生')
    return
  }
  saving.value = true
  try {
    await saveGrade({ ...f, studentName: stu.name, classId: stu.class || f.classId, usual: Number(f.usual), final: Number(f.final) })
    writeLog(f.id ? '修改' : '新增', `${f.id ? '修改' : '录入'}「${stu.name}」成绩`)
    ElMessage.success('成绩已保存')
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
    await ElMessageBox.confirm(`确定删除「${row.studentName}」的成绩记录吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteGrade(row.id)
  writeLog('删除', `删除「${row.studentName}」成绩记录`)
  ElMessage.success('删除成功')
  await load()
}

function exportCsv() {
  const rows = [['学期', '课程', '班级', '学生', '平时成绩', '期末成绩', '综合成绩']]
  filtered.value.forEach((g) => rows.push([g.term, courseMap.value[g.courseId]?.name || '', classMap.value[g.classId] || '', g.studentName, g.usual, g.final, g.total]))
  const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '成绩导出.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

async function load() {
  loading.value = true
  try {
    const [g, c, cl, s] = await Promise.all([getGrades(), getCourses(), getClasses(), getAllStudents().catch(() => ({ data: [] }))])
    grades.value = g
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
        <h2 class="page-title">{{ isStudent ? '成绩查询' : '成绩管理' }}</h2>
        <p class="page-sub">{{ isStudent ? '查询个人课程成绩与通过情况' : '按课程和班级录入、维护、导出学生成绩' }}</p>
      </div>
      <div class="header-actions">
        <el-button v-if="hasPerm('grade:export')" round :icon="Icons.Download" @click="exportCsv">导出</el-button>
        <el-button v-perm="'grade:add'" type="primary" round @click="openAdd"><el-icon><Icons.Plus /></el-icon>录入成绩</el-button>
      </div>
    </div>

    <div class="summary-grid">
      <el-card class="plain-card" shadow="never"><div class="summary-value">{{ filtered.length }}</div><div class="summary-label">成绩记录</div></el-card>
      <el-card class="plain-card" shadow="never"><div class="summary-value">{{ avgScore }}</div><div class="summary-label">平均分</div></el-card>
      <el-card class="plain-card" shadow="never"><div class="summary-value">{{ passRate }}%</div><div class="summary-label">通过率</div></el-card>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <el-select v-model="search.courseId" placeholder="全部课程" clearable style="width: 190px">
          <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-if="!isStudent" v-model="search.classId" placeholder="全部班级" clearable style="width: 180px">
          <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-input v-model="search.term" placeholder="学期，如 2026-2027-1" clearable style="width: 190px" />
      </div>

      <SkeletonTable v-if="loading" :rows="5" :cols="6" />
      <el-table v-else :data="filtered" style="width: 100%">
        <el-table-column prop="term" label="学期" width="130" align="center" />
        <el-table-column label="课程" min-width="170"><template #default="{ row }">{{ courseMap[row.courseId]?.name || '未知课程' }}</template></el-table-column>
        <el-table-column label="班级" min-width="160"><template #default="{ row }">{{ classMap[row.classId] || '未分班' }}</template></el-table-column>
        <el-table-column prop="studentName" label="学生" width="110" align="center" />
        <el-table-column prop="usual" label="平时" width="90" align="center" />
        <el-table-column prop="final" label="期末" width="90" align="center" />
        <el-table-column label="综合" width="100" align="center">
          <template #default="{ row }"><el-tag round :type="row.total >= 60 ? 'success' : 'danger'">{{ row.total }}</el-tag></template>
        </el-table-column>
        <el-table-column v-if="!isStudent" label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button v-perm="'grade:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
            <el-button v-perm="'grade:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><EmptyState title="暂无成绩" description="录入成绩后会在这里显示" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="成绩录入" width="520px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="学期" required><el-input v-model="form.term" /></el-form-item>
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
        <el-form-item label="学生" required>
          <el-select v-model="form.studentId" placeholder="选择学生" filterable style="width: 100%">
            <el-option v-for="s in studentOptions" :key="s.id" :label="`${s.name}（${s.id}）`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="平时/期末">
          <div class="score-row">
            <el-input-number v-model="form.usual" :min="0" :max="100" />
            <el-input-number v-model="form.final" :min="0" :max="100" />
          </div>
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
.header-actions { display: flex; gap: 10px; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; }
.summary-value { font-size: 24px; font-weight: 700; color: var(--text-h); }
.summary-label { font-size: 13px; color: var(--text-light); }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
.score-row { display: flex; gap: 12px; width: 100%; }
@media (max-width: 760px) { .summary-grid { grid-template-columns: 1fr; } }
</style>
