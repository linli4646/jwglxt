<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import { getCourses, getGrades } from '../api/db'
import { auth } from '../store/auth'

const loading = ref(true)
const courses = ref([])
const grades = ref([])

const myGrades = computed(() => grades.value.filter((g) => g.studentId === auth.user?.id || g.studentName === auth.user?.name))
const myCourseIds = computed(() => new Set(myGrades.value.map((g) => g.courseId)))
const passedIds = computed(() => new Set(myGrades.value.filter((g) => Number(g.total) >= 60).map((g) => g.courseId)))
const myCourses = computed(() => courses.value.filter((c) => (c.classes || []).includes(auth.user?.classNo) || myCourseIds.value.has(c.id)))
const totalCredit = computed(() => myCourses.value.reduce((sum, c) => sum + Number(c.credit || 0), 0))
const earnedCredit = computed(() => myCourses.value.filter((c) => passedIds.value.has(c.id)).reduce((sum, c) => sum + Number(c.credit || 0), 0))
const progress = computed(() => totalCredit.value ? Math.round((earnedCredit.value / totalCredit.value) * 100) : 0)

function gradeOf(courseId) {
  return myGrades.value.find((g) => g.courseId === courseId)
}

onMounted(async () => {
  try {
    const [c, g] = await Promise.all([getCourses(), getGrades()])
    courses.value = c
    grades.value = g
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">学分统计</h2>
        <p class="page-sub">统计已修学分、待完成课程和成绩通过情况</p>
      </div>
    </div>

    <div class="credit-grid">
      <el-card class="plain-card" shadow="never">
        <div class="metric-icon"><el-icon><Icons.Medal /></el-icon></div>
        <div class="metric-value">{{ earnedCredit }}</div>
        <div class="metric-label">已获学分</div>
      </el-card>
      <el-card class="plain-card" shadow="never">
        <div class="metric-icon orange"><el-icon><Icons.Reading /></el-icon></div>
        <div class="metric-value">{{ totalCredit }}</div>
        <div class="metric-label">应修学分</div>
      </el-card>
      <el-card class="plain-card" shadow="never">
        <div class="metric-icon green"><el-icon><Icons.TrendCharts /></el-icon></div>
        <div class="metric-value">{{ progress }}%</div>
        <div class="metric-label">完成进度</div>
      </el-card>
    </div>

    <el-card class="plain-card" shadow="never">
      <template #header>
        <div class="panel-title"><el-icon><Icons.DataAnalysis /></el-icon> 课程学分明细</div>
      </template>
      <el-skeleton v-if="loading" animated :rows="5" />
      <el-table v-else-if="myCourses.length" :data="myCourses" style="width: 100%">
        <el-table-column prop="name" label="课程" min-width="180" />
        <el-table-column prop="type" label="类型" width="90" align="center">
          <template #default="{ row }"><el-tag round size="small" effect="light">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="credit" label="学分" width="90" align="center" />
        <el-table-column label="成绩" width="100" align="center">
          <template #default="{ row }">{{ gradeOf(row.id)?.total ?? '未录入' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag round size="small" :type="passedIds.has(row.id) ? 'success' : 'info'">{{ passedIds.has(row.id) ? '已通过' : '待完成' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-else title="暂无学分数据" description="课程或成绩录入后会显示统计结果" />
    </el-card>
  </div>
</template>

<style scoped>
.credit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 18px; }
.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: var(--primary);
  background: var(--primary-light);
}
.metric-icon.orange { color: #ff9f43; background: rgba(255, 159, 67, 0.12); }
.metric-icon.green { color: #00b578; background: rgba(0, 181, 120, 0.12); }
.metric-value { margin-top: 12px; font-size: 26px; font-weight: 700; color: var(--text-h); }
.metric-label { font-size: 13px; color: var(--text-light); }
.panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text-h); }
@media (max-width: 760px) { .credit-grid { grid-template-columns: 1fr; } }
</style>
