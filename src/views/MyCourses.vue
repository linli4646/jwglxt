<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import { getCourses, getUsers, getClasses } from '../api/db'
import { auth } from '../store/auth'

const loading = ref(true)
const courses = ref([])
const users = ref([])
const classes = ref([])

const keyword = ref('')
const typeFilter = ref('')
const detailVisible = ref(false)
const detail = ref(null)

const isTeacher = computed(() => auth.user?.role === 'teacher')

const teacherName = computed(() => {
  const map = {}
  users.value.forEach((t) => (map[t.account] = t.name))
  return (account) => map[account] || '待分配'
})

const className = computed(() => {
  const map = {}
  classes.value.forEach((c) => (map[c.id] = c.name))
  return (ids) => (ids || []).map((id) => map[id] || `班级 ${id}`).join('、') || '未分配'
})

const myCourses = computed(() => {
  let list = courses.value.filter((c) => c.status === 1)
  if (isTeacher.value) {
    list = list.filter((c) => c.teacher === auth.user.account)
  } else {
    list = list.filter((c) => (c.classes || []).includes(auth.user.classNo))
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) list = list.filter((c) => c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw))
  if (typeFilter.value) list = list.filter((c) => c.type === typeFilter.value)
  return list
})

function openDetail(course) {
  detail.value = course
  detailVisible.value = true
}

onMounted(async () => {
  try {
    const [c, u, cl] = await Promise.all([getCourses(), getUsers(), getClasses()])
    courses.value = c
    users.value = u
    classes.value = cl
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
        <h2 class="page-title">我的课程</h2>
        <p class="page-sub">
          {{ isTeacher ? `共 ${myCourses.length} 门授课课程，可查看授课班级与时间` : `你所在班级共有 ${myCourses.length} 门课程` }}
        </p>
      </div>
    </div>

    <el-card class="plain-card" shadow="never">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="按课程名称 / 编号筛选" clearable style="width: 260px">
          <template #prefix><el-icon><Icons.Search /></el-icon></template>
        </el-input>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width: 130px">
          <el-option label="必修" value="必修" />
          <el-option label="选修" value="选修" />
        </el-select>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loading" class="course-grid">
        <div v-for="i in 4" :key="i" class="course-card plain-card">
          <div class="skeleton-block" style="height: 18px; width: 60%; margin-bottom: 16px" />
          <div class="skeleton-block" style="height: 12px; margin-bottom: 10px" />
          <div class="skeleton-block" style="height: 12px; width: 75%; margin-bottom: 20px" />
          <div class="skeleton-block" style="height: 34px" />
        </div>
      </div>

      <!-- 课程卡片 -->
      <div v-else-if="myCourses.length" class="course-grid">
        <div v-for="c in myCourses" :key="c.id" class="course-card card-hover" @click="openDetail(c)">
          <div class="course-head">
            <span class="course-icon"><el-icon :size="20"><Icons.Reading /></el-icon></span>
            <el-tag round size="small" effect="light" :type="c.type === '必修' ? 'danger' : 'primary'">{{ c.type }}</el-tag>
          </div>
          <h3 class="course-name">{{ c.name }}</h3>
          <p class="course-code">编号 {{ c.code }} · {{ c.credit }} 学分 · {{ c.hours }} 课时</p>
          <div class="course-info">
            <span><el-icon><Icons.User /></el-icon>{{ teacherName(c.teacher) }}</span>
            <span><el-icon><Icons.Clock /></el-icon>{{ c.time || '时间待定' }}</span>
            <span><el-icon><Icons.School /></el-icon>{{ (c.classes || []).length }} 个班级</span>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        title="暂无课程"
        :description="isTeacher ? '管理员为你安排课程后会显示在这里' : '你所在班级还没有排课'"
      />
    </el-card>

    <!-- 课程详情 -->
    <el-dialog v-model="detailVisible" title="课程详情" width="520px">
      <template v-if="detail">
        <div class="detail-head">
          <span class="course-icon big"><el-icon :size="24"><Icons.Reading /></el-icon></span>
          <div>
            <h3 class="detail-name">{{ detail.name }}</h3>
            <p class="course-code">编号 {{ detail.code }}</p>
          </div>
        </div>
        <el-descriptions :column="2" border style="margin-top: 18px">
          <el-descriptions-item label="课程类型">{{ detail.type }}</el-descriptions-item>
          <el-descriptions-item label="学分">{{ detail.credit }}</el-descriptions-item>
          <el-descriptions-item label="课时">{{ detail.hours }}</el-descriptions-item>
          <el-descriptions-item label="授课时间">{{ detail.time || '待定' }}</el-descriptions-item>
          <el-descriptions-item label="授课教师">{{ teacherName(detail.teacher) }}</el-descriptions-item>
          <el-descriptions-item label="授课班级">{{ className(detail.classes) }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 20px; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
@media (max-width: 1100px) { .course-grid { grid-template-columns: repeat(2, 1fr); } }

.course-card {
  padding: 20px;
  border-radius: 14px;
  background: #fff;
  box-shadow: var(--shadow);
  cursor: pointer;
}
.course-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.course-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #ff9f43;
  background: rgba(255, 159, 67, 0.12);
}
.course-icon.big { width: 48px; height: 48px; }
.course-name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
}
.course-code { margin: 0; font-size: 12px; color: var(--text-light); }
.course-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
  font-size: 12.5px;
  color: #5b6675;
}
.course-info span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-head { display: flex; align-items: center; gap: 14px; }
.detail-name { margin: 0 0 2px; font-size: 18px; font-weight: 600; color: var(--text-h); }
</style>
