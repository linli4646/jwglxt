<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { updateUser, getCourses, getClasses, writeLog } from '../api/db'
import { auth, refreshUser, currentRole } from '../store/auth'

const user = computed(() => auth.user)
const role = computed(() => currentRole())

const loading = ref(true)
const saving = ref(false)
const profile = ref({ name: '', phone: '', email: '' })

const passwordForm = ref({ old: '', next: '', confirm: '' })
const changing = ref(false)

// 个人统计
const stats = ref({ courses: 0, classes: 0 })

const avatarText = computed(() => (user.value?.name || '?').slice(0, 1))

const roleColor = computed(() => {
  const map = { super_admin: 'linear-gradient(135deg,#7c4dff,#5b7cfa)', admin: 'linear-gradient(135deg,#1b87db,#3a7bd5)', teacher: 'linear-gradient(135deg,#00b578,#52c41a)', student: 'linear-gradient(135deg,#ff9f43,#f7b500)' }
  return map[user.value?.role] || 'linear-gradient(135deg,#1b87db,#5b7cfa)'
})

async function loadStats() {
  try {
    const [courses, classes] = await Promise.all([getCourses(), getClasses()])
    if (user.value?.role === 'teacher') {
      stats.value.courses = courses.filter((c) => c.teacher === user.value.account).length
    } else if (user.value?.role === 'student') {
      stats.value.courses = courses.filter((c) => c.status === 1 && (c.classes || []).includes(user.value.classNo)).length
      const cls = classes.find((c) => c.id === user.value.classNo)
      stats.value.classes = cls ? 1 : 0
    } else {
      stats.value.courses = courses.length
      stats.value.classes = classes.length
    }
  } catch (e) { /* 统计失败不影响使用 */ }
}

async function saveProfile() {
  if (!profile.value.name) {
    ElMessage.warning('姓名不能为空')
    return
  }
  saving.value = true
  try {
    await updateUser(user.value.id, profile.value)
    refreshUser()
    writeLog('修改', `用户「${user.value.name}」更新个人资料`)
    ElMessage.success('资料已更新')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  const p = passwordForm.value
  if (!p.old || !p.next || !p.confirm) {
    ElMessage.warning('请完整填写密码信息')
    return
  }
  if (p.old !== user.value.password) {
    ElMessage.error('原密码不正确')
    return
  }
  if (p.next.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (p.next !== p.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  changing.value = true
  try {
    await updateUser(user.value.id, { password: p.next })
    refreshUser()
    writeLog('修改', `用户「${user.value.name}」修改登录密码`)
    ElMessage.success('密码修改成功')
    passwordForm.value = { old: '', next: '', confirm: '' }
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    changing.value = false
  }
}

onMounted(async () => {
  profile.value = { name: user.value?.name || '', phone: user.value?.phone || '', email: user.value?.email || '' }
  await loadStats()
  loading.value = false
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">个人空间</h2>
        <p class="page-sub">管理你的个人资料、登录密码与我的数据</p>
      </div>
    </div>

    <div class="profile-grid">
      <!-- 个人信息卡 -->
      <el-card class="plain-card profile-card" shadow="never">
        <el-skeleton v-if="loading" animated :rows="4" />
        <template v-else>
          <div class="profile-hero">
            <div class="big-avatar" :style="{ background: roleColor }">{{ avatarText }}</div>
            <div>
              <h3 class="profile-name">{{ user?.name }}</h3>
              <div class="profile-tags">
                <el-tag round effect="light">{{ role?.name }}</el-tag>
                <span class="account">@{{ user?.account }}</span>
              </div>
            </div>
          </div>
          <el-descriptions :column="1" class="profile-desc">
            <el-descriptions-item label="手机号">{{ user?.phone || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user?.email || '未填写' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ user?.createTime }}</el-descriptions-item>
            <el-descriptions-item label="最近登录">{{ user?.lastLogin || '—' }}</el-descriptions-item>
            <el-descriptions-item label="登录次数">{{ user?.loginCount || 0 }} 次</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-card>

      <div class="profile-right">
        <!-- 编辑资料 -->
        <el-card class="plain-card" shadow="never">
          <template #header>
            <div class="panel-title"><el-icon><Icons.EditPen /></el-icon> 编辑资料</div>
          </template>
          <el-skeleton v-if="loading" animated :rows="3" />
          <el-form v-else :model="profile" label-width="70px" style="max-width: 420px">
            <el-form-item label="姓名">
              <el-input v-model="profile.name" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profile.phone" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profile.email" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" round :loading="saving" @click="saveProfile">保存资料</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 修改密码 -->
        <el-card class="plain-card" shadow="never">
          <template #header>
            <div class="panel-title"><el-icon><Icons.Lock /></el-icon> 修改密码</div>
          </template>
          <el-form :model="passwordForm" label-width="70px" style="max-width: 420px">
            <el-form-item label="原密码">
              <el-input v-model="passwordForm.old" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.next" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirm" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" round plain :loading="changing" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>

    <!-- 我的统计 -->
    <el-card class="plain-card my-stats" shadow="never">
      <template #header>
        <div class="panel-title"><el-icon><Icons.DataLine /></el-icon> 我的数据</div>
      </template>
      <div class="stat-mini-grid">
        <div class="mini-card card-hover">
          <span class="mini-icon" style="background: rgba(255, 159, 67, 0.12); color: #ff9f43"><el-icon :size="20"><Icons.Reading /></el-icon></span>
          <div>
            <div class="mini-value">{{ stats.courses }}</div>
            <div class="mini-label">{{ user?.role === 'student' ? '我的课程' : user?.role === 'teacher' ? '授课课程' : '全部课程' }}</div>
          </div>
        </div>
        <div class="mini-card card-hover">
          <span class="mini-icon" style="background: rgba(124, 77, 255, 0.12); color: #7c4dff"><el-icon :size="20"><Icons.School /></el-icon></span>
          <div>
            <div class="mini-value">{{ user?.role === 'student' ? (stats.classes ? '1' : '0') : stats.classes }}</div>
            <div class="mini-label">{{ user?.role === 'student' ? '所在班级' : '班级总数' }}</div>
          </div>
        </div>
        <div class="mini-card card-hover">
          <span class="mini-icon" style="background: rgba(0, 181, 120, 0.12); color: #00b578"><el-icon :size="20"><Icons.TrendCharts /></el-icon></span>
          <div>
            <div class="mini-value">{{ user?.loginCount || 0 }}</div>
            <div class="mini-label">登录次数</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
@media (max-width: 1000px) { .profile-grid { grid-template-columns: 1fr; } }

.profile-card { height: fit-content; }
.profile-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 2px 18px;
  border-bottom: 1px dashed var(--border);
  margin-bottom: 16px;
}
.big-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 8px 18px rgba(15, 42, 80, 0.18);
}
.profile-name { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: var(--text-h); }
.profile-tags { display: flex; align-items: center; gap: 10px; }
.account { font-size: 13px; color: var(--text-light); }
.profile-desc :deep(.el-descriptions__label) { width: 90px; }

.profile-right { display: flex; flex-direction: column; gap: 18px; }

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h);
}

.stat-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 760px) { .stat-mini-grid { grid-template-columns: 1fr; } }
.mini-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 12px;
  background: #f7fafd;
  border: 1px solid var(--border);
}
.mini-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}
.mini-value { font-size: 22px; font-weight: 700; color: var(--text-h); line-height: 1.2; }
.mini-label { font-size: 12.5px; color: var(--text-light); }
</style>
