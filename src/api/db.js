// 本地模拟数据库（localStorage 持久化）
// 说明：实训项目为保证课堂演示不依赖外部服务，用户/角色/菜单/班级/课程/公告/日志/设置
// 均存放在浏览器 localStorage 中；学生基础数据仍走 Supabase（见 api/xuesheng.js）。
// 所有读写接口均为异步并带少量延时，方便前端展示骨架屏。

const DB_KEY = 'jwglxt_db_v3'

export { DB_KEY }

/* ---------------- 种子数据 ---------------- */
function seed() {
  const now = new Date().toISOString()
  return {
    users: [
      { id: 1, account: 'superadmin', password: '123456', name: '系统超管', role: 'super_admin', status: 1, phone: '13800000001', email: 'super@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 2, account: 'admin01', password: '123456', name: '张管理员', role: 'admin', status: 1, phone: '13800000002', email: 'admin@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 3, account: 'admin02', password: '123456', name: '陈主任', role: 'admin', status: 1, phone: '13800000005', email: 'chen@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 4, account: 'teacher01', password: '123456', name: '李老师', role: 'teacher', status: 1, phone: '13800000003', email: 'teacher@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 5, account: 'teacher02', password: '123456', name: '王教授', role: 'teacher', status: 1, phone: '13800000006', email: 'wang@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 6, account: 'teacher03', password: '123456', name: '赵老师', role: 'teacher', status: 1, phone: '13800000007', email: 'zhao@jwglxt.edu', classNo: null, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 7, account: 'student01', password: '123456', name: '王小明', role: 'student', status: 1, phone: '13800000004', email: 'student@jwglxt.edu', classNo: 1, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 8, account: 'student02', password: '123456', name: '李小红', role: 'student', status: 1, phone: '13900000001', email: 'li@jwglxt.edu', classNo: 1, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 9, account: 'student03', password: '123456', name: '张伟', role: 'student', status: 1, phone: '13900000002', email: 'zhangw@jwglxt.edu', classNo: 2, createTime: now, lastLogin: null, loginCount: 0 },
      { id: 10, account: 'student04', password: '123456', name: '刘芳', role: 'student', status: 1, phone: '13900000003', email: 'liuf@jwglxt.edu', classNo: 3, createTime: now, lastLogin: null, loginCount: 0 }
    ],
    roles: [
      { code: 'super_admin', name: '超级管理员', desc: '拥有系统全部权限，可管理系统、用户、权限、日志', menus: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], perms: ['*'], builtin: true },
      { code: 'admin', name: '管理员', desc: '负责班级、课程、公告等业务管理', menus: [1, 2, 3, 4, 6, 8, 12, 13, 14], perms: ['student:add', 'student:edit', 'student:delete', 'user:add', 'user:edit', 'user:delete', 'user:toggle', 'class:add', 'class:edit', 'class:delete', 'class:assign', 'course:add', 'course:edit', 'course:delete', 'notice:add', 'notice:edit', 'notice:delete', 'notice:top', 'grade:add', 'grade:edit', 'grade:delete', 'grade:export', 'attendance:add', 'attendance:edit', 'attendance:delete', 'attendance:export'], builtin: true },
      { code: 'teacher', name: '教师', desc: '查看授课课程与学生信息', menus: [1, 2, 5, 6, 12, 13, 14], perms: ['grade:add', 'grade:edit', 'grade:export', 'attendance:add', 'attendance:edit', 'attendance:export'], builtin: true },
      { code: 'student', name: '学生', desc: '查看公告与个人课程信息', menus: [1, 5, 6, 12, 13, 14, 15, 16], perms: [], builtin: true }
    ],
    // type: 1=菜单 2=按钮（按钮仅用于页面内权限控制）
    menus: [
      { id: 1, parentId: null, name: '首页仪表盘', path: '/dashboard', icon: 'House', order: 1, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
      { id: 2, parentId: null, name: '学生信息', path: '/students', icon: 'User', order: 2, hidden: 0, roles: ['super_admin', 'admin', 'teacher'], type: 1 },
      { id: 3, parentId: null, name: '班级管理', path: '/classes', icon: 'School', order: 3, hidden: 0, roles: ['super_admin', 'admin'], type: 1 },
      { id: 4, parentId: null, name: '课程管理', path: '/courses', icon: 'Reading', order: 4, hidden: 0, roles: ['super_admin', 'admin'], type: 1 },
      { id: 5, parentId: null, name: '我的课程', path: '/my-courses', icon: 'Calendar', order: 5, hidden: 0, roles: ['teacher', 'student'], type: 1 },
      { id: 6, parentId: null, name: '公告中心', path: '/notices', icon: 'Bell', order: 6, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
      { id: 7, parentId: null, name: '系统管理', path: '/system', icon: 'Tools', order: 7, hidden: 0, roles: ['super_admin', 'admin'], type: 1 },
      { id: 8, parentId: 7, name: '用户管理', path: '/users', icon: 'UserFilled', order: 1, hidden: 0, roles: ['super_admin', 'admin'], type: 1 },
      { id: 9, parentId: 7, name: '菜单管理', path: '/menus', icon: 'Menu', order: 2, hidden: 0, roles: ['super_admin'], type: 1 },
      { id: 10, parentId: 7, name: '角色权限', path: '/roles', icon: 'Key', order: 3, hidden: 0, roles: ['super_admin'], type: 1 },
      { id: 11, parentId: 7, name: '操作日志', path: '/logs', icon: 'Document', order: 4, hidden: 0, roles: ['super_admin'], type: 1 },
      { id: 12, parentId: null, name: '个人空间', path: '/profile', icon: 'Avatar', order: 12, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
      { id: 13, parentId: null, name: '成绩管理', path: '/grades', icon: 'TrendCharts', order: 7, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
      { id: 14, parentId: null, name: '考勤管理', path: '/attendance', icon: 'Checked', order: 8, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
      { id: 15, parentId: null, name: '我的课表', path: '/schedule', icon: 'Calendar', order: 5, hidden: 0, roles: ['student'], type: 1 },
      { id: 16, parentId: null, name: '学分统计', path: '/credits', icon: 'DataAnalysis', order: 9, hidden: 0, roles: ['student'], type: 1 }
    ],
    classes: [
      { id: 1, name: '软件工程 2401 班', major: '软件工程', year: 2024, count: 38, counselor: 'teacher01', status: 1, createTime: now },
      { id: 2, name: '计算机科学 2402 班', major: '计算机科学与技术', year: 2024, count: 35, counselor: 'teacher01', status: 1, createTime: now },
      { id: 3, name: '人工智能 2403 班', major: '人工智能', year: 2024, count: 32, counselor: 'teacher02', status: 1, createTime: now },
      { id: 4, name: '数据科学 2404 班', major: '数据科学与大数据技术', year: 2024, count: 30, counselor: 'teacher02', status: 1, createTime: now },
      { id: 5, name: '网络工程 2405 班', major: '网络工程', year: 2024, count: 28, counselor: 'teacher03', status: 1, createTime: now }
    ],
    courses: [
      { id: 1, name: 'Web 前端框架技术', code: 'CS2401', type: '必修', credit: 4, hours: 64, teacher: 'teacher01', classes: [1, 2], time: '周一 1-2 节', status: 1, createTime: now },
      { id: 2, name: '数据结构与算法', code: 'CS2402', type: '必修', credit: 3.5, hours: 56, teacher: 'teacher01', classes: [1, 3], time: '周三 3-4 节', status: 1, createTime: now },
      { id: 3, name: '数据库原理', code: 'CS2403', type: '必修', credit: 4, hours: 64, teacher: 'teacher02', classes: [1, 2, 4], time: '周二 5-6 节', status: 1, createTime: now },
      { id: 4, name: '操作系统', code: 'CS2404', type: '必修', credit: 4, hours: 64, teacher: 'teacher02', classes: [3, 4], time: '周四 1-2 节', status: 1, createTime: now },
      { id: 5, name: '计算机网络', code: 'CS2405', type: '必修', credit: 3, hours: 48, teacher: 'teacher03', classes: [2, 5], time: '周五 3-4 节', status: 1, createTime: now },
      { id: 6, name: '大学生心理健康', code: 'GE1101', type: '选修', credit: 2, hours: 32, teacher: null, classes: [1, 2, 3, 4, 5], time: '周五 5-6 节', status: 1, createTime: now }
    ],
    notices: [
      { id: 1, title: '关于 2026 年秋季学期选课通知', type: '教务通知', content: '2026 年秋季学期选课将于 10 月 15 日 9:00 开始，请同学们按时登录教务系统完成选课，逾期不再补选。', top: 1, status: 1, publishTime: '2026-10-12 09:00', author: 'admin01', createTime: now },
      { id: 2, title: '期末考试安排（暂定）', type: '考试安排', content: '本学期期末考试周为第 19-20 周，具体考试安排详见后续通知，请提前做好复习准备。', top: 0, status: 1, publishTime: '2026-10-10 14:30', author: 'admin01', createTime: now },
      { id: 3, title: '国庆节放假调休通知', type: '放假通知', content: '根据学校安排，国庆节放假时间调整如下：10 月 1 日至 7 日放假，10 月 8 日（周六）、10 月 9 日（周日）正常上课。', top: 0, status: 1, publishTime: '2026-09-28 10:00', author: 'superadmin', createTime: now },
      { id: 4, title: '关于开展期中教学检查的通知', type: '教务通知', content: '第 9-10 周将开展期中教学检查，请各位教师提前准备教学文档与课件，配合督导组听课检查。', top: 0, status: 1, publishTime: '2026-09-20 16:00', author: 'admin02', createTime: now },
      { id: 5, title: '2026 届毕业生图像采集安排', type: '教务通知', content: '毕业生图像采集定于 11 月 5 日在图书馆报告厅进行，请毕业生按时到场，着装整洁。', top: 0, status: 0, publishTime: '2026-09-15 09:30', author: 'admin01', createTime: now }
    ],
    grades: [
      { id: 1, studentId: 1, studentName: '王小明', classId: 1, courseId: 1, term: '2026-2027-1', usual: 86, final: 88, total: 87, createTime: now },
      { id: 2, studentId: 2, studentName: '李小红', classId: 1, courseId: 1, term: '2026-2027-1', usual: 92, final: 90, total: 91, createTime: now },
      { id: 3, studentId: 3, studentName: '张伟', classId: 2, courseId: 1, term: '2026-2027-1', usual: 78, final: 81, total: 80, createTime: now },
      { id: 4, studentId: 4, studentName: '刘芳', classId: 3, courseId: 2, term: '2026-2027-1', usual: 84, final: 79, total: 81, createTime: now }
    ],
    attendance: [
      {
        id: 1,
        courseId: 1,
        classId: 1,
        date: '2026-10-12',
        lesson: '第 1-2 节',
        records: [
          { studentId: 1, studentName: '王小明', status: '出勤' },
          { studentId: 2, studentName: '李小红', status: '迟到' }
        ],
        createTime: now
      },
      {
        id: 2,
        courseId: 2,
        classId: 3,
        date: '2026-10-13',
        lesson: '第 3-4 节',
        records: [
          { studentId: 4, studentName: '刘芳', status: '出勤' }
        ],
        createTime: now
      }
    ],
    logs: [],
    settings: { systemName: '教务管理系统', subTitle: 'Educational Administration Management System', footerText: '教务管理系统 · 前端框架技术实训项目', allowReset: 1 }
  }
}

/* ---------------- 基础工具 ---------------- */
function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch (e) { /* 数据损坏时重新初始化 */ }
  const data = seed()
  localStorage.setItem(DB_KEY, JSON.stringify(data))
  return data
}

let db = load()

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function migrate(data) {
  const base = seed()
  data.grades = data.grades || base.grades
  data.attendance = data.attendance || base.attendance
  data.notices = (data.notices || base.notices).filter((n) => !/^测试公告 \d{4}$/.test(n.title || ''))
  data.settings = { ...base.settings, ...(data.settings || {}) }

  const requiredMenus = [
    { id: 13, parentId: null, name: '成绩管理', path: '/grades', icon: 'TrendCharts', order: 6, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
    { id: 14, parentId: null, name: '考勤管理', path: '/attendance', icon: 'Checked', order: 7, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 },
    { id: 15, parentId: null, name: '我的课表', path: '/schedule', icon: 'Calendar', order: 5, hidden: 0, roles: ['student'], type: 1 },
    { id: 16, parentId: null, name: '学分统计', path: '/credits', icon: 'DataAnalysis', order: 8, hidden: 0, roles: ['student'], type: 1 }
  ]
  data.menus = data.menus || []
  requiredMenus.forEach((menu) => {
    const existing = data.menus.find((m) => m.id === menu.id || m.path === menu.path)
    if (existing) Object.assign(existing, { ...menu, ...existing, roles: Array.from(new Set([...(existing.roles || []), ...menu.roles])) })
    else data.menus.push(menu)
  })

  const roleDefaults = {
    super_admin: { menus: [13, 14], perms: ['grade:add', 'grade:edit', 'grade:delete', 'grade:export', 'attendance:add', 'attendance:edit', 'attendance:delete', 'attendance:export'] },
    admin: { menus: [13, 14], perms: ['grade:add', 'grade:edit', 'grade:delete', 'grade:export', 'attendance:add', 'attendance:edit', 'attendance:delete', 'attendance:export'] },
    teacher: { menus: [13, 14], perms: ['grade:add', 'grade:edit', 'grade:export', 'attendance:add', 'attendance:edit', 'attendance:export'] },
    student: { menus: [13, 14, 15, 16], perms: [] }
  }
  ;(data.roles || []).forEach((role) => {
    const extra = roleDefaults[role.code]
    if (!extra) return
    role.menus = Array.from(new Set([...(role.menus || []), ...extra.menus]))
    role.perms = role.perms?.includes('*') ? role.perms : Array.from(new Set([...(role.perms || []), ...extra.perms]))
  })

  localStorage.setItem(DB_KEY, JSON.stringify(data))
  return data
}

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// 模拟网络延时，让骨架屏有展示机会
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

function nowStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/* ---------------- 日志 ---------------- */
function currentSession() {
  try {
    const raw = localStorage.getItem('jwglxt_session_v2')
    if (!raw) return null
    const { account } = JSON.parse(raw)
    return db.users.find((u) => u.account === account) || null
  } catch (e) {
    return null
  }
}

export function writeLog(action, detail = '') {
  const u = currentSession()
  db.logs.unshift({
    id: uid(),
    user: u ? u.name : '',
    account: u ? u.account : '',
    action,
    detail,
    time: nowStr()
  })
  if (db.logs.length > 500) db.logs.length = 500
  save()
}

export function readLogs() {
  return clone(db.logs)
}

export async function getLogs() {
  await delay()
  return readLogs()
}

export async function clearLogs() {
  await delay()
  db.logs = []
  save()
}

/* ---------------- 认证 ---------------- */
export async function doLogin(account, password) {
  await delay(500)
  const user = db.users.find((u) => u.account === account)
  if (!user) throw new Error('账号不存在')
  if (user.password !== password) throw new Error('密码错误')
  if (user.status !== 1) throw new Error('该账号已被禁用，请联系管理员')
  user.lastLogin = nowStr()
  user.loginCount = (user.loginCount || 0) + 1
  save()
  db.logs.unshift({ id: uid(), user: user.name, account: user.account, action: '登录', detail: `用户「${user.name}」登录系统`, time: nowStr() })
  return clone(user)
}

export async function doLogout(account) {
  await delay(120)
  db.logs.unshift({ id: uid(), user: '', account: account || '', action: '登出', detail: '用户退出登录', time: nowStr() })
  save()
}

/* ---------------- 用户 ---------------- */
export async function getUsers() {
  await delay()
  return clone(db.users)
}

export async function addUser(data) {
  await delay()
  if (db.users.some((u) => u.account === data.account)) throw new Error('账号已存在')
  const user = { id: db.users.reduce((m, u) => Math.max(m, u.id), 0) + 1, loginCount: 0, lastLogin: null, createTime: nowStr(), ...data }
  db.users.push(user)
  save()
  return clone(user)
}

export async function updateUser(id, data) {
  await delay()
  const user = db.users.find((u) => u.id === id)
  if (!user) throw new Error('用户不存在')
  Object.assign(user, data)
  save()
  return clone(user)
}

export async function deleteUser(id) {
  await delay()
  db.users = db.users.filter((u) => u.id !== id)
  save()
}

export function findUserByAccount(account) {
  return clone(db.users.find((u) => u.account === account))
}

/* ---------------- 角色 ---------------- */
export async function getRoles() {
  await delay()
  return clone(db.roles)
}

export async function addRole(data) {
  await delay()
  if (db.roles.some((r) => r.code === data.code)) throw new Error('角色编码已存在')
  const role = { builtin: false, menus: [], perms: [], ...data }
  db.roles.push(role)
  save()
  return clone(role)
}

export async function updateRole(code, data) {
  await delay()
  const role = db.roles.find((r) => r.code === code)
  if (!role) throw new Error('角色不存在')
  Object.assign(role, data)
  save()
  return clone(role)
}

export async function deleteRole(code) {
  await delay()
  const role = db.roles.find((r) => r.code === code)
  if (!role) throw new Error('角色不存在')
  if (role.builtin) throw new Error('内置角色不可删除')
  if (db.users.some((u) => u.role === code)) throw new Error('仍有用户属于该角色，无法删除')
  db.roles = db.roles.filter((r) => r.code !== code)
  save()
}

/* ---------------- 菜单 ---------------- */
export async function getMenus() {
  await delay()
  return clone(db.menus)
}

export async function addMenu(data) {
  await delay()
  const menu = { id: db.menus.reduce((m, x) => Math.max(m, x.id), 0) + 1, hidden: 0, order: 1, roles: [], type: 1, ...data }
  db.menus.push(menu)
  save()
  return clone(menu)
}

export async function updateMenu(id, data) {
  await delay()
  const menu = db.menus.find((m) => m.id === id)
  if (!menu) throw new Error('菜单不存在')
  Object.assign(menu, data)
  save()
  return clone(menu)
}

export async function deleteMenu(id) {
  await delay()
  // 连同子菜单一起删除，并从各角色的授权里移除
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    db.menus.forEach((m) => {
      if (m.parentId && ids.has(m.parentId) && !ids.has(m.id)) {
        ids.add(m.id)
        changed = true
      }
    })
  }
  db.menus = db.menus.filter((m) => !ids.has(m.id))
  db.roles.forEach((r) => {
    r.menus = r.menus.filter((mid) => !ids.has(mid))
  })
  save()
}

/* ---------------- 班级 ---------------- */
export async function getClasses() {
  await delay()
  return clone(db.classes)
}

export async function addClass(data) {
  await delay()
  const cls = { id: db.classes.reduce((m, c) => Math.max(m, c.id), 0) + 1, createTime: nowStr(), ...data }
  db.classes.push(cls)
  save()
  return clone(cls)
}

export async function updateClass(id, data) {
  await delay()
  const cls = db.classes.find((c) => c.id === id)
  if (!cls) throw new Error('班级不存在')
  Object.assign(cls, data)
  save()
  return clone(cls)
}

export async function deleteClass(id) {
  await delay()
  db.classes = db.classes.filter((c) => c.id !== id)
  save()
}

/* ---------------- 课程 ---------------- */
export async function getCourses() {
  await delay()
  return clone(db.courses)
}

export async function addCourse(data) {
  await delay()
  const course = { id: db.courses.reduce((m, c) => Math.max(m, c.id), 0) + 1, createTime: nowStr(), ...data }
  db.courses.push(course)
  save()
  return clone(course)
}

export async function updateCourse(id, data) {
  await delay()
  const course = db.courses.find((c) => c.id === id)
  if (!course) throw new Error('课程不存在')
  Object.assign(course, data)
  save()
  return clone(course)
}

export async function deleteCourse(id) {
  await delay()
  db.courses = db.courses.filter((c) => c.id !== id)
  save()
}

/* ---------------- 公告 ---------------- */
export async function getNotices() {
  await delay()
  return clone(db.notices)
}

export async function addNotice(data) {
  await delay()
  const notice = { id: db.notices.reduce((m, n) => Math.max(m, n.id), 0) + 1, top: 0, createTime: nowStr(), ...data }
  db.notices.unshift(notice)
  save()
  return clone(notice)
}

export async function updateNotice(id, data) {
  await delay()
  const notice = db.notices.find((n) => n.id === id)
  if (!notice) throw new Error('公告不存在')
  Object.assign(notice, data)
  save()
  return clone(notice)
}

export async function deleteNotice(id) {
  await delay()
  db.notices = db.notices.filter((n) => n.id !== id)
  save()
}

/* ---------------- 成绩 ---------------- */
export async function getGrades() {
  await delay()
  return clone(db.grades || [])
}

export async function saveGrade(data) {
  await delay()
  const total = Math.round((Number(data.usual || 0) * 0.4 + Number(data.final || 0) * 0.6) * 10) / 10
  const existed = (db.grades || []).find((g) => g.studentId === data.studentId && g.courseId === data.courseId && g.term === data.term)
  if (existed && existed.id !== data.id) throw new Error('该学生本学期该课程成绩已存在')
  if (data.id) {
    const grade = db.grades.find((g) => g.id === data.id)
    if (!grade) throw new Error('成绩记录不存在')
    Object.assign(grade, data, { total })
    save()
    return clone(grade)
  }
  const grade = { id: db.grades.reduce((m, g) => Math.max(m, Number(g.id) || 0), 0) + 1, createTime: nowStr(), ...data, total }
  db.grades.push(grade)
  save()
  return clone(grade)
}

export async function deleteGrade(id) {
  await delay()
  db.grades = (db.grades || []).filter((g) => g.id !== id)
  save()
}

/* ---------------- 考勤 ---------------- */
export async function getAttendance() {
  await delay()
  return clone(db.attendance || [])
}

export async function saveAttendance(data) {
  await delay()
  if (data.id) {
    const item = db.attendance.find((a) => a.id === data.id)
    if (!item) throw new Error('考勤记录不存在')
    Object.assign(item, data)
    save()
    return clone(item)
  }
  const item = { id: db.attendance.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0) + 1, createTime: nowStr(), ...data }
  db.attendance.unshift(item)
  save()
  return clone(item)
}

export async function deleteAttendance(id) {
  await delay()
  db.attendance = (db.attendance || []).filter((a) => a.id !== id)
  save()
}

/* ---------------- 系统设置 ---------------- */
export async function getSettings() {
  await delay(80)
  return clone(db.settings)
}

export async function saveSettings(data) {
  await delay()
  Object.assign(db.settings, data)
  save()
  return clone(db.settings)
}

export async function resetDatabase() {
  await delay(600)
  db = seed()
  save()
}

/* ---------------- 仪表盘统计 ---------------- */
export async function getStats() {
  await delay()
  const roleMap = { super_admin: '超级管理员', admin: '管理员', teacher: '教师', student: '学生' }
  return {
    userCount: db.users.length,
    classCount: db.classes.length,
    courseCount: db.courses.length,
    noticeCount: db.notices.length,
    onlineToday: db.users.filter((u) => u.lastLogin).length,
    roleDist: db.roles
      .map((r) => ({ code: r.code, name: r.name, count: db.users.filter((u) => u.role === r.code).length }))
      .filter((r) => r.count > 0),
    roleName: (code) => roleMap[code] || code,
    recentLogs: clone(db.logs.slice(0, 8))
  }
}
