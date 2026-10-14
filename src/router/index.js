// 路由配置：登录页公开访问，其余页面均需登录并通过“菜单授权”校验
// 权限模型：不写死路由 roles，而是用 auth.canAccess(path) 读取菜单表中的授权，
// 实现真正意义上的“动态菜单 + 动态路由”权限隔离。
import { createRouter, createWebHistory } from 'vue-router'
import { auth, canAccess } from '../store/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '首页仪表盘' } },
      { path: 'students', component: () => import('../views/Students.vue'), meta: { title: '学生信息' } },
      { path: 'classes', component: () => import('../views/Classes.vue'), meta: { title: '班级管理' } },
      { path: 'courses', component: () => import('../views/Courses.vue'), meta: { title: '课程管理' } },
      { path: 'my-courses', component: () => import('../views/MyCourses.vue'), meta: { title: '我的课程' } },
      { path: 'schedule', component: () => import('../views/Schedule.vue'), meta: { title: '我的课表' } },
      { path: 'grades', component: () => import('../views/Grades.vue'), meta: { title: '成绩管理' } },
      { path: 'attendance', component: () => import('../views/Attendance.vue'), meta: { title: '考勤管理' } },
      { path: 'credits', component: () => import('../views/Credits.vue'), meta: { title: '学分统计' } },
      { path: 'notices', component: () => import('../views/Notices.vue'), meta: { title: '公告中心' } },
      { path: 'users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'menus', component: () => import('../views/Menus.vue'), meta: { title: '菜单管理' } },
      { path: 'roles', component: () => import('../views/Roles.vue'), meta: { title: '角色权限' } },
      { path: 'logs', component: () => import('../views/Logs.vue'), meta: { title: '操作日志' } },
      { path: 'settings', component: () => import('../views/Settings.vue'), meta: { title: '系统设置' } },
      { path: 'profile', component: () => import('../views/Profile.vue'), meta: { title: '个人空间' } }
    ]
  },
  { path: '/403', component: () => import('../views/Forbidden.vue'), meta: { public: true, title: '无权限' } },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue'), meta: { public: true, title: '页面不存在' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫：
// 1. 未登录访问内部页面 -> 跳转登录页（记录来源，登录后回跳）
// 2. 已登录访问 /login -> 回首页
// 3. 已登录但角色未被授权该菜单 -> 跳 403（低权限角色禁止访问高权限页面）
router.beforeEach((to) => {
  document.title = `${to.meta.title || ''} · 教务管理系统`

  if (to.meta.public) {
    if (to.path === '/login' && auth.user) return '/dashboard'
    return true
  }

  if (!auth.user) {
    return { path: '/login', query: to.path === '/dashboard' ? {} : { redirect: to.fullPath } }
  }

  if (auth.user.role === 'super_admin' || canAccess(to.path)) {
    return true
  }
  return '/403'
})

export default router
