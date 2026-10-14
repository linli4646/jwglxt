// 认证与权限中心（响应式单例 store）
// 负责：登录会话持久化、权限判断（按钮权限 hasPerm / 菜单访问 canAccess）、动态菜单计算
import { reactive } from 'vue'
import { doLogin, doLogout, findUserByAccount, DB_KEY } from '../api/db'

const SESSION_KEY = 'jwglxt_session_v2'

// 页面刷新后从 localStorage 恢复会话，并同步数据库里的最新角色信息
let saved = null
try {
  saved = JSON.parse(localStorage.getItem(SESSION_KEY))
} catch (e) { /* ignore */ }

export const auth = reactive({
  user: saved ? findUserByAccount(saved.account) || null : null
})

export function persist() {
  if (auth.user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ account: auth.user.account }))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export async function login(account, password) {
  const user = await doLogin(account, password)
  auth.user = user
  persist()
  return user
}

export async function logout() {
  const account = auth.user?.account
  auth.user = null
  persist()
  try {
    await doLogout(account)
  } catch (e) { /* 日志写入失败不影响登出 */ }
}

export function refreshUser() {
  if (auth.user) {
    const latest = findUserByAccount(auth.user.account)
    if (latest) {
      auth.user = latest
    } else {
      // 账号已被删除，强制下线
      auth.user = null
      persist()
    }
  }
}

// 当前用户所属角色定义
export function currentRole() {
  if (!auth.user) return null
  return loadRoles().find((r) => r.code === auth.user.role) || null
}

function loadRoles() {
  // 与 db.js 共用同一份 localStorage 数据源
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw).roles || []
  } catch (e) { /* ignore */ }
  return []
}

function loadMenus() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw).menus || []
  } catch (e) { /* ignore */ }
  return []
}

// 按钮级权限：permissions 含 '*' 或指定权限码
export function hasPerm(code) {
  if (!auth.user) return false
  if (code === '*') return true
  const role = currentRole()
  if (!role) return false
  if (role.perms.includes('*')) return true
  return role.perms.includes(code)
}

// 页面级权限：用户角色被授权的菜单中是否存在该路径
export function canAccess(path) {
  if (!auth.user) return false
  const menus = loadMenus()
  return menus.some((m) => m.path === path && m.roles.includes(auth.user.role))
}

// 计算当前用户的侧边栏菜单树（隐藏菜单不展示）
export function sidebarMenus() {
  if (!auth.user) return []
  const menus = loadMenus()
  const visible = menus.filter((m) => !m.hidden && m.roles.includes(auth.user.role))
  const tree = []
  visible
    .filter((m) => !m.parentId)
    .sort((a, b) => a.order - b.order)
    .forEach((top) => {
      const children = visible
        .filter((m) => m.parentId === top.id)
        .sort((a, b) => a.order - b.order)
      tree.push({ ...top, children: children.length ? children : null })
    })
  return tree
}

// 依据路径找到菜单标题（用于面包屑）
export function menuTitle(path) {
  const menus = loadMenus()
  const m = menus.find((x) => x.path === path)
  return m ? m.name : ''
}
