<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import { getCourses, getUsers } from '../api/db'
import { auth } from '../store/auth'

const loading = ref(true)
const courses = ref([])
const users = ref([])
const days = ['周一', '周二', '周三', '周四', '周五']
const slots = ['1-2', '3-4', '5-6', '7-8']
const colors = ['#1b87db', '#00b578', '#ff9f43', '#7c4dff', '#f56c6c']

const teacherName = computed(() => {
  const map = {}
  users.value.forEach((u) => (map[u.account] = u.name))
  return (account) => map[account] || '待分配'
})
const myCourses = computed(() => courses.value.filter((c) => c.status === 1 && (c.classes || []).includes(auth.user?.classNo)))

function parseTime(time = '') {
  const day = days.find((d) => time.includes(d))
  const slot = slots.find((s) => time.includes(s))
  return { day, slot }
}

function cellCourses(day, slot) {
  return myCourses.value.filter((c) => {
    const parsed = parseTime(c.time)
    return parsed.day === day && parsed.slot === slot
  })
}

onMounted(async () => {
  try {
    const [c, u] = await Promise.all([getCourses(), getUsers()])
    courses.value = c
    users.value = u
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
        <h2 class="page-title">我的课表</h2>
        <p class="page-sub">按周查看当前班级课程安排、教师和课时信息</p>
      </div>
    </div>

    <el-card class="plain-card" shadow="never">
      <el-skeleton v-if="loading" animated :rows="6" />
      <template v-else-if="myCourses.length">
        <div class="schedule">
          <div class="corner">节次</div>
          <div v-for="d in days" :key="d" class="day-head">{{ d }}</div>
          <template v-for="slot in slots" :key="slot">
            <div class="slot">{{ slot }} 节</div>
            <div v-for="day in days" :key="`${day}-${slot}`" class="cell">
              <div
                v-for="(c, index) in cellCourses(day, slot)"
                :key="c.id"
                class="course-chip"
                :style="{ borderColor: colors[index % colors.length], background: colors[index % colors.length] + '12' }"
              >
                <div class="course-name">{{ c.name }}</div>
                <div class="course-meta"><el-icon><Icons.User /></el-icon>{{ teacherName(c.teacher) }}</div>
                <div class="course-meta"><el-icon><Icons.Clock /></el-icon>{{ c.time }}</div>
              </div>
            </div>
          </template>
        </div>
      </template>
      <EmptyState v-else title="暂无课表" description="管理员为你所在班级排课后会显示在这里" />
    </el-card>
  </div>
</template>

<style scoped>
.schedule {
  display: grid;
  grid-template-columns: 90px repeat(5, minmax(130px, 1fr));
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.corner,
.day-head,
.slot,
.cell {
  min-height: 86px;
  padding: 12px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.corner,
.day-head,
.slot {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--text-h);
  background: #f7fafd;
}
.cell { background: #fff; }
.course-chip {
  padding: 10px;
  border-left: 4px solid var(--primary);
  border-radius: 10px;
}
.course-chip + .course-chip { margin-top: 8px; }
.course-name { font-size: 13px; font-weight: 600; color: var(--text-h); }
.course-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-light);
}
</style>
