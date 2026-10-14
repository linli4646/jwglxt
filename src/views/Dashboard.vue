<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as Icons from '@element-plus/icons-vue'
import StatCard from '../components/StatCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { getClasses, getCourses, getNotices, getStats } from '../api/db'
import { getAllStudents } from '../api/xuesheng'
import { auth, currentRole } from '../store/auth'

const router = useRouter()
const loading = ref(true)
const stats = ref({ userCount: 0, classCount: 0, courseCount: 0, noticeCount: 0, onlineToday: 0, roleDist: [], recentLogs: [] })
const studentCount = ref(0)
const studentError = ref(false)
const students = ref([])
const classes = ref([])
const courses = ref([])
const notices = ref([])

const role = computed(() => currentRole())
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 角色分布图配色
const roleColors = { super_admin: '#7c4dff', admin: '#1b87db', teacher: '#00b578', student: '#ff9f43' }
const maxRoleCount = computed(() => Math.max(1, ...stats.value.roleDist.map((r) => r.count)))
const roleDisplayName = (role) => role.code === 'student' ? '学生账号' : role.name

const classDist = computed(() => {
  const className = Object.fromEntries(classes.value.map((c) => [c.id, c.name]))
  const map = {}
  students.value.forEach((s) => {
    const key = s.class || 'none'
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map)
    .map(([id, count]) => ({ key: id, name: id === 'none' ? '未分班' : className[id] || `${id} 班`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})
const courseTypeDist = computed(() => {
  const map = {}
  courses.value.forEach((c) => { map[c.type || '未分类'] = (map[c.type || '未分类'] || 0) + 1 })
  return Object.entries(map).map(([name, count]) => ({ name, count }))
})
const noticeStatusDist = computed(() => {
  const publicCount = notices.value.filter((n) => n.status === 1).length
  const hiddenCount = notices.value.length - publicCount
  return [
    { name: '公开公告', count: publicCount },
    { name: '隐藏公告', count: hiddenCount }
  ].filter((item) => item.count > 0)
})
const maxClassCount = computed(() => Math.max(1, ...classDist.value.map((x) => x.count)))
const maxCourseTypeCount = computed(() => Math.max(1, ...courseTypeDist.value.map((x) => x.count)))
const maxNoticeStatusCount = computed(() => Math.max(1, ...noticeStatusDist.value.map((x) => x.count)))

const logIcons = {
  登录: { icon: 'CircleCheck', color: '#00b578' },
  登出: { icon: 'CircleClose', color: '#9aa4b2' },
  新增: { icon: 'Plus', color: '#1b87db' },
  删除: { icon: 'Delete', color: '#f56c6c' },
  修改: { icon: 'EditPen', color: '#ff9f43' },
  发布: { icon: 'Promotion', color: '#7c4dff' }
}

function logMeta(action) {
  for (const key of Object.keys(logIcons)) {
    if (action && action.includes(key)) return logIcons[key]
  }
  return { icon: 'Document', color: '#9aa4b2' }
}

const quickActions = computed(() => {
  const all = [
    { label: '用户管理', path: '/users', icon: 'UserFilled', roles: ['super_admin', 'admin'] },
    { label: '班级管理', path: '/classes', icon: 'School', roles: ['super_admin', 'admin'] },
    { label: '课程管理', path: '/courses', icon: 'Reading', roles: ['super_admin', 'admin'] },
    { label: '发布公告', path: '/notices', icon: 'Bell', roles: ['super_admin', 'admin', 'teacher', 'student'] },
    { label: '我的课程', path: '/my-courses', icon: 'Calendar', roles: ['teacher', 'student'] }
  ]
  return all.filter((a) => a.roles.includes(auth.user?.role))
})

function go(path) {
  router.push(path)
}

onMounted(async () => {
  const [s, c, courseList, noticeList] = await Promise.all([
    getStats(),
    getClasses(),
    getCourses(),
    getNotices(),
    getAllStudents().then(({ data }) => {
      students.value = data
      studentCount.value = data.length
    }).catch(() => { studentError.value = true })
  ])
  stats.value = s
  classes.value = c
  courses.value = courseList
  notices.value = noticeList
  loading.value = false
})
</script>

<template>
  <div class="page dashboard">
    <!-- 欢迎横幅 -->
    <el-card class="welcome card-hover" shadow="never">
      <div class="welcome-inner">
        <div>
          <h2 class="welcome-title">{{ greeting }}，{{ auth.user?.name }}</h2>
          <p class="welcome-sub">
            当前角色：<el-tag size="small" round effect="light">{{ role?.name || auth.user?.role }}</el-tag>
            <span class="dot">·</span>
            欢迎使用教务管理系统，今天也要加油哦
          </p>
        </div>
        <el-button type="primary" round @click="go('/profile')">
          <el-icon style="margin-right: 6px"><Icons.Avatar /></el-icon>进入个人空间
        </el-button>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <StatCard label="系统用户数" :value="stats.userCount" icon="UserFilled" color="#1b87db" :loading="loading" />
      <StatCard label="学生信息数" :value="studentError ? '--' : studentCount" icon="Avatar" color="#00b578" :loading="loading" suffix="人" />
      <StatCard label="班级数" :value="stats.classCount" icon="School" color="#7c4dff" :loading="loading" />
      <StatCard label="课程数" :value="stats.courseCount" icon="Reading" color="#ff9f43" :loading="loading" />
      <StatCard label="公告数" :value="stats.noticeCount" icon="Bell" color="#f56c6c" :loading="loading" />
    </div>

    <div class="dash-grid">
      <!-- 综合分布 -->
      <el-card class="panel card-hover" shadow="never">
        <template #header>
          <div class="panel-title"><el-icon><Icons.PieChart /></el-icon> 综合分布</div>
        </template>
        <template v-if="loading">
          <el-skeleton animated :rows="8" />
        </template>
        <template v-else-if="stats.roleDist.length">
          <div class="dist-section">
            <div class="dist-title">系统账号角色分布</div>
            <div class="role-item" v-for="r in stats.roleDist" :key="r.code">
              <div class="role-info">
                <span class="role-dot" :style="{ background: roleColors[r.code] || '#1b87db' }"></span>
                <span class="role-name">{{ roleDisplayName(r) }}</span>
                <span class="role-count">{{ r.count }} 人</span>
              </div>
              <div class="role-bar">
                <div
                  class="role-bar-inner"
                  :style="{ width: (r.count / maxRoleCount) * 100 + '%', background: roleColors[r.code] || '#1b87db' }"
                ></div>
              </div>
            </div>
          </div>

          <div class="dist-section">
            <div class="dist-title">学生班级分布 Top 5</div>
            <div class="role-item compact" v-for="item in classDist" :key="item.key">
              <div class="role-info">
                <span class="role-dot" style="background: #00b578"></span>
                <span class="role-name">{{ item.name }}</span>
                <span class="role-count">{{ item.count }} 人</span>
              </div>
              <div class="role-bar">
                <div class="role-bar-inner" :style="{ width: (item.count / maxClassCount) * 100 + '%', background: '#00b578' }"></div>
              </div>
            </div>
          </div>

          <div class="mini-dist-grid">
            <div class="dist-section mini">
              <div class="dist-title">课程类型</div>
              <div class="role-item compact" v-for="item in courseTypeDist" :key="item.name">
                <div class="role-info">
                  <span class="role-dot" style="background: #ff9f43"></span>
                  <span class="role-name">{{ item.name }}</span>
                  <span class="role-count">{{ item.count }} 门</span>
                </div>
                <div class="role-bar">
                  <div class="role-bar-inner" :style="{ width: (item.count / maxCourseTypeCount) * 100 + '%', background: '#ff9f43' }"></div>
                </div>
              </div>
            </div>
            <div class="dist-section mini">
              <div class="dist-title">公告状态</div>
              <div class="role-item compact" v-for="item in noticeStatusDist" :key="item.name">
                <div class="role-info">
                  <span class="role-dot" :style="{ background: item.name.includes('公开') ? '#67c23a' : '#9aa4b2' }"></span>
                  <span class="role-name">{{ item.name }}</span>
                  <span class="role-count">{{ item.count }} 条</span>
                </div>
                <div class="role-bar">
                  <div class="role-bar-inner" :style="{ width: (item.count / maxNoticeStatusCount) * 100 + '%', background: item.name.includes('公开') ? '#67c23a' : '#9aa4b2' }"></div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <EmptyState v-else title="暂无用户数据" description="添加用户后这里会展示角色分布" />
      </el-card>

      <!-- 最近动态 -->
      <el-card class="panel card-hover" shadow="never">
        <template #header>
          <div class="panel-title"><el-icon><Icons.Timer /></el-icon> 最近动态</div>
        </template>
        <template v-if="loading">
          <el-skeleton animated :rows="5" />
        </template>
        <template v-else-if="stats.recentLogs.length">
          <ul class="log-list">
            <li v-for="log in stats.recentLogs" :key="log.id" class="log-item">
              <span class="log-icon" :style="{ background: logMeta(log.action).color + '1a', color: logMeta(log.action).color }">
                <el-icon><component :is="Icons[logMeta(log.action).icon]" /></el-icon>
              </span>
              <div class="log-meta">
                <div class="log-title">{{ log.detail }}</div>
                <div class="log-time">{{ log.time }}</div>
              </div>
            </li>
          </ul>
        </template>
        <EmptyState v-else title="暂无动态" description="登录和操作记录会显示在这里" />
      </el-card>
    </div>

    <!-- 快捷入口 -->
    <el-card class="panel card-hover" shadow="never">
      <template #header>
        <div class="panel-title"><el-icon><Icons.Compass /></el-icon> 快捷入口</div>
      </template>
      <div class="quick-grid">
        <div v-for="q in quickActions" :key="q.path" class="quick-item card-hover" @click="go(q.path)">
          <el-icon :size="22"><component :is="Icons[q.icon]" /></el-icon>
          <span>{{ q.label }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  width: 100%;
  max-width: none;
}

.welcome { margin-bottom: 20px; }
.welcome-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
}
.welcome-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--text-h); }
.welcome-sub { margin: 8px 0 0; font-size: 13px; color: var(--text-light); }
.welcome-sub .dot { margin: 0 8px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }

.dash-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1000px) { .dash-grid { grid-template-columns: 1fr; } }

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}

.dist-section + .dist-section,
.mini-dist-grid { margin-top: 14px; }
.dist-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-h);
}
.mini-dist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.role-item { margin-bottom: 12px; }
.role-item.compact { margin-bottom: 9px; }
.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 13px;
}
.role-dot { width: 8px; height: 8px; border-radius: 50%; }
.role-name { color: var(--text-h); font-weight: 500; }
.role-count { margin-left: auto; color: var(--text-light); }
.role-bar {
  height: 7px;
  border-radius: 4px;
  background: #eef2f7;
  overflow: hidden;
}
.role-bar-inner {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.log-list { list-style: none; margin: 0; padding: 0; }
.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.log-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
}
.log-meta { min-width: 0; }
.log-title {
  font-size: 13px;
  color: var(--text-h);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.log-time { font-size: 12px; color: var(--text-light); }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 12px;
  background: #f7fafd;
  border: 1px solid var(--border);
  color: var(--primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s;
}
.quick-item:hover { color: var(--primary); background: var(--primary-light); }
@media (max-width: 760px) { .quick-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
