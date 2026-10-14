<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import { auth, logout, sidebarMenus, menuTitle, currentRole } from '../store/auth'
import { getSettings } from '../api/db'

const route = useRoute()
const router = useRouter()

const collapsed = ref(false)
const menus = computed(() => sidebarMenus())
const role = computed(() => currentRole())
const settings = ref({ systemName: '教务管理系统' })

onMounted(async () => {
  try {
    settings.value = await getSettings()
  } catch (e) { /* 使用默认名称 */ }
})

const activeMenu = computed(() => route.path)
const crumbs = computed(() => [menuTitle(route.path) || route.meta.title])

// 权限变更后菜单可能变化（如超管在“菜单管理”里隐藏了当前页）
function icon(name) {
  return Icons[name] || Icons.Menu
}

async function handleCommand(cmd) {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
    await logout()
    ElMessage.success('已安全退出')
    router.replace('/login')
  }
}

const avatarText = computed(() => (auth.user?.name || '?').slice(0, 1))
</script>

<template>
  <div class="layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed }">
      <div class="logo" @click="router.push('/dashboard')">
        <div class="logo-mark">
          <el-icon :size="20"><Icons.School /></el-icon>
        </div>
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">{{ settings.systemName }}</span>
        </transition>
      </div>

      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          :collapse-transition="false"
          router
          class="side-menu"
        >
          <template v-for="m in menus" :key="m.id">
            <el-sub-menu v-if="m.children" :index="`sub-${m.id}`">
              <template #title>
                <el-icon><component :is="icon(m.icon)" /></el-icon>
                <span>{{ m.name }}</span>
              </template>
              <el-menu-item v-for="c in m.children" :key="c.id" :index="c.path">
                <el-icon><component :is="icon(c.icon)" /></el-icon>
                <span>{{ c.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="m.path">
              <el-icon><component :is="icon(m.icon)" /></el-icon>
              <template #title>{{ m.name }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <div v-if="!collapsed" class="sidebar-foot">
        前端框架技术 · 实训项目
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Icons.Fold v-if="!collapsed" />
            <Icons.Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="c in crumbs" :key="c">{{ c }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-chip">
              <div class="avatar">{{ avatarText }}</div>
              <div class="user-meta">
                <span class="user-name">{{ auth.user?.name }}</span>
                <el-tag v-if="role" size="small" round effect="light">{{ role.name }}</el-tag>
              </div>
              <el-icon class="caret"><Icons.ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><Icons.Avatar /></el-icon>个人空间
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><Icons.SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="footer">{{ settings.footerText || '教务管理系统' }}</footer>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ---------- 侧边栏 ---------- */
.sidebar {
  display: flex;
  flex-direction: column;
  width: 232px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f7fafd 100%);
  border-right: 1px solid var(--border);
  transition: width 0.25s ease;
}
.sidebar.collapsed { width: 64px; }

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
}
.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #1b87db, #5b7cfa);
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
  letter-spacing: 1px;
}

.menu-scroll { flex: 1; }
.side-menu { border-right: none; background: transparent; }
.side-menu :deep(.el-menu-item),
.side-menu :deep(.el-sub-menu__title) {
  margin: 4px 10px;
  border-radius: 10px;
  height: 44px;
  line-height: 44px;
  color: #4a5568;
  transition: background-color 0.2s, color 0.2s;
}
.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background: var(--primary-light);
  color: var(--primary);
}
.side-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #1b87db, #3a7bd5);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6px 14px rgba(27, 135, 219, 0.3);
}
.sidebar.collapsed .side-menu :deep(.el-menu-item),
.sidebar.collapsed .side-menu :deep(.el-sub-menu__title) {
  margin: 4px 8px;
}

.sidebar-foot {
  padding: 14px 16px;
  font-size: 12px;
  color: var(--text-light);
  border-top: 1px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
}

/* ---------- 主区域 ---------- */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.collapse-btn {
  font-size: 18px;
  color: #6b7686;
  cursor: pointer;
  transition: color 0.2s;
}
.collapse-btn:hover { color: var(--primary); }

.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px 5px 6px;
  border-radius: 24px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.user-chip:hover { background: #f1f5fa; }
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1b87db, #5b7cfa);
}
.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.2;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-h);
}
.user-meta :deep(.el-tag) { height: 18px; font-size: 11px; }
.caret { font-size: 12px; color: #9aa4b2; }

.content {
  flex: 1;
  overflow-y: auto;
  background:
    radial-gradient(circle at 100% 0, rgba(27, 135, 219, 0.04), transparent 40%),
    var(--bg);
}

.footer {
  padding: 12px 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-light);
  border-top: 1px solid var(--border);
  background: #fff;
}
</style>
