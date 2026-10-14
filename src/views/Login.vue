<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { login } from '../store/auth'
import { getSettings } from '../api/db'

const route = useRoute()
const router = useRouter()

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const settings = ref({ systemName: '教务管理系统', subTitle: '' })

// 课堂演示账号（点击即可自动填充）
const demoAccounts = [
  { account: 'superadmin', label: '超管' },
  { account: 'admin01', label: '管理员' },
  { account: 'teacher01', label: '教师' },
  { account: 'student01', label: '学生' }
]

onMounted(async () => {
  try {
    settings.value = await getSettings()
  } catch (e) { /* 忽略 */ }
})

function fill(account) {
  form.account = account
  form.password = '123456'
}

async function handleLogin() {
  if (!form.account || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const user = await login(form.account.trim(), form.password)
    ElMessage.success(`欢迎回来，${user.name}`)
    router.replace(route.query.redirect || '/dashboard')
  } catch (e) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌面板 -->
      <div class="brand">
        <div class="brand-inner">
          <div class="brand-logo">
            <el-icon :size="26"><Icons.School /></el-icon>
          </div>
          <h1 class="brand-title">{{ settings.systemName }}</h1>
          <p class="brand-sub">{{ settings.subTitle }}</p>
          <ul class="brand-points">
            <li><el-icon><Icons.Check /></el-icon>多角色权限隔离 · 动态菜单</li>
            <li><el-icon><Icons.Check /></el-icon>班级 / 课程 / 公告一体化管理</li>
            <li><el-icon><Icons.Check /></el-icon>操作日志全流程审计</li>
          </ul>
        </div>
        <div class="brand-circles" aria-hidden="true">
          <span class="c c1"></span>
          <span class="c c2"></span>
          <span class="c c3"></span>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-panel">
        <h2 class="form-title">欢迎登录</h2>
        <p class="form-sub">请使用学校分配的账号登录系统</p>

        <el-form @submit.prevent="handleLogin">
          <el-form-item>
            <el-input v-model="form.account" size="large" placeholder="请输入账号" clearable>
              <template #prefix><el-icon><Icons.User /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              placeholder="请输入密码"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix><el-icon><Icons.Lock /></el-icon></template>
            </el-input>
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中…' : '登 录' }}
          </el-button>
        </el-form>

        <div class="demo">
          <div class="demo-title">演示账号（密码均为 123456）</div>
          <div class="demo-chips">
            <span
              v-for="d in demoAccounts"
              :key="d.account"
              class="chip"
              :class="{ active: form.account === d.account }"
              @click="fill(d.account)"
            >
              {{ d.label }} · {{ d.account }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p class="login-foot">© {{ new Date().getFullYear() }} {{ settings.systemName }} · 前端框架技术实训项目</p>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px 16px;
  background:
    radial-gradient(circle at 15% 20%, rgba(27, 135, 219, 0.16), transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(91, 124, 250, 0.14), transparent 45%),
    linear-gradient(135deg, #eef4fb 0%, #e8eef7 100%);
}

.login-card {
  display: flex;
  width: 860px;
  max-width: 100%;
  min-height: 500px;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 42, 80, 0.14);
}

/* 左侧品牌区 */
.brand {
  position: relative;
  flex: 1.1;
  padding: 56px 44px;
  color: #fff;
  background: linear-gradient(150deg, #1e3c72 0%, #2a5298 50%, #1b87db 100%);
  overflow: hidden;
}
.brand-inner { position: relative; z-index: 1; }
.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(4px);
}
.brand-title {
  margin: 22px 0 6px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 4px;
}
.brand-sub {
  margin: 0 0 30px;
  font-size: 12px;
  letter-spacing: 2px;
  opacity: 0.75;
}
.brand-points {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.brand-points li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  opacity: 0.92;
}
.brand-circles .c {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}
.c1 { width: 220px; height: 220px; right: -70px; top: -60px; }
.c2 { width: 140px; height: 140px; right: 40px; bottom: -50px; }
.c3 { width: 60px; height: 60px; right: 130px; top: 60px; }

/* 右侧表单区 */
.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px 52px;
}
.form-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-h);
}
.form-sub {
  margin: 8px 0 30px;
  font-size: 13px;
  color: var(--text-light);
}
.login-btn {
  width: 100%;
  height: 46px;
  margin-top: 6px;
  border-radius: 12px;
  font-size: 15px;
  letter-spacing: 6px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(27, 135, 219, 0.35);
}

.demo { margin-top: 30px; }
.demo-title {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--text-light);
}
.demo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  color: #5b6675;
  background: #f2f6fb;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  color: var(--primary);
  background: var(--primary-light);
}
.chip.active {
  color: var(--primary);
  background: var(--primary-light);
  border-color: var(--primary);
}

.login-foot {
  margin-top: 24px;
  font-size: 12px;
  color: #a4afbd;
}

@media (max-width: 900px) {
  .brand { display: none; }
  .login-card { width: 420px; }
  .form-panel { padding: 44px 36px; }
}
</style>
