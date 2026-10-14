<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getRoles, getMenus, getUsers, addRole, updateRole, deleteRole, writeLog } from '../api/db'
import { auth } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const roles = ref([])
const menus = ref([])
const users = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})
const checkedMenuKeys = ref([])
const menuTreeRef = ref(null)
const menuTree = ref([])

// 全部按钮权限点
const permOptions = [
  { code: 'user:add', label: '添加用户' },
  { code: 'user:edit', label: '编辑用户' },
  { code: 'user:delete', label: '删除用户' },
  { code: 'user:toggle', label: '启用/禁用用户' },
  { code: 'student:add', label: '添加学生' },
  { code: 'student:edit', label: '编辑学生' },
  { code: 'student:delete', label: '删除学生' },
  { code: 'class:add', label: '添加班级' },
  { code: 'class:edit', label: '编辑班级' },
  { code: 'class:delete', label: '删除班级' },
  { code: 'class:assign', label: '分配班级学生' },
  { code: 'course:add', label: '添加课程' },
  { code: 'course:edit', label: '编辑课程' },
  { code: 'course:delete', label: '删除课程' },
  { code: 'notice:add', label: '发布公告' },
  { code: 'notice:edit', label: '编辑公告' },
  { code: 'notice:delete', label: '删除公告' },
  { code: 'notice:top', label: '公告置顶' },
  { code: 'menu:manage', label: '菜单管理' },
  { code: 'role:manage', label: '角色权限管理' },
  { code: 'log:view', label: '查看操作日志' },
  { code: 'setting:edit', label: '修改系统设置' }
]

const roleColors = { super_admin: '#7c4dff', admin: '#1b87db', teacher: '#00b578', student: '#ff9f43' }

function userCountOf(code) {
  return users.value.filter((u) => u.role === code).length
}

function buildTree(list) {
  const map = {}
  list.forEach((m) => (map[m.id] = { ...m }))
  const roots = []
  list.forEach((m) => {
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children = map[m.parentId].children || []
      map[m.parentId].children.push(map[m.id])
    } else {
      roots.push(map[m.id])
    }
  })
  const sortRec = (arr) => arr.sort((a, b) => a.order - b.order) && arr.forEach((x) => x.children && sortRec(x.children))
  sortRec(roots)
  return roots
}

function openAdd() {
  isEdit.value = false
  form.value = { code: '', name: '', desc: '', perms: [] }
  checkedMenuKeys.value = []
  dialogVisible.value = true
  nextTick(() => menuTreeRef.value?.setCheckedKeys([]))
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row, perms: [...(row.perms || [])] }
  checkedMenuKeys.value = [...(row.menus || [])]
  dialogVisible.value = true
  nextTick(() => menuTreeRef.value?.setCheckedKeys(row.menus || []))
}

// 快捷模板授权
function applyTemplate(tpl) {
  const role = roles.value.find((r) => r.code === tpl)
  if (!role) return
  form.value.perms = [...role.perms]
  checkedMenuKeys.value = [...role.menus]
  requestAnimationFrame(() => {
    menuTreeRef.value?.setCheckedKeys(role.menus)
  })
  ElMessage.success(`已按「${role.name}」模板填充权限`)
}

async function handleSave() {
  const f = form.value
  if (!f.code || !f.name) {
    ElMessage.warning('请填写角色编码和名称')
    return
  }
  if (!isEdit.value && !/^[a-z_]+$/.test(f.code)) {
    ElMessage.warning('角色编码仅支持小写字母和下划线')
    return
  }
  saving.value = true
  try {
    const menus = [...new Set([...checkedMenuKeys.value, ...(menuTreeRef.value?.getHalfCheckedKeys?.() || [])])]
    const data = { name: f.name, desc: f.desc, menus, perms: f.perms }
    if (isEdit.value) {
      await updateRole(f.code, data)
      writeLog('修改', `修改角色「${f.name}」权限配置`)
      ElMessage.success('保存成功')
    } else {
      await addRole({ code: f.code, ...data })
      writeLog('新增', `新增角色「${f.name}」`)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  if (row.code === 'super_admin') {
    ElMessage.warning('内置超级管理员角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteRole(row.code)
    writeLog('删除', `删除角色「${row.name}」`)
    ElMessage.success('删除成功')
    await load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

async function load() {
  loading.value = true
  try {
    const [r, m, u] = await Promise.all([getRoles(), getMenus(), getUsers()])
    roles.value = r
    menus.value = m
    users.value = u
    menuTree.value = buildTree(m)
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2 class="page-title">角色与权限</h2>
        <p class="page-sub">为角色分配可见菜单与按钮操作权限，实现按角色的权限隔离</p>
      </div>
      <el-button v-perm="'role:manage'" type="primary" round @click="openAdd">
        <el-icon style="margin-right: 6px"><Icons.Plus /></el-icon>添加角色
      </el-button>
    </div>

    <SkeletonTable v-if="loading" :rows="4" :cols="4" />
    <div v-else class="role-grid">
      <el-card v-for="r in roles" :key="r.code" class="role-card card-hover" shadow="never">
        <div class="role-head">
          <span class="role-icon" :style="{ background: (roleColors[r.code] || '#1b87db') + '1a', color: roleColors[r.code] || '#1b87db' }">
            <el-icon :size="20"><Icons.Key /></el-icon>
          </span>
          <div class="role-title">
            <span class="role-name">{{ r.name }}</span>
            <span class="role-code">{{ r.code }}</span>
          </div>
          <el-tag v-if="r.builtin" round size="small" effect="plain">内置</el-tag>
        </div>
        <p class="role-desc">{{ r.desc }}</p>
        <div class="role-stats">
          <span><strong>{{ userCountOf(r.code) }}</strong> 名用户</span>
          <span><strong>{{ r.menus.length }}</strong> 个菜单</span>
          <span><strong>{{ r.perms.includes('*') ? '全部' : r.perms.length }}</strong> 项权限</span>
        </div>
        <div class="role-actions">
          <el-button v-perm="'role:manage'" size="small" round type="primary" plain @click="openEdit(r)">配置权限</el-button>
          <el-button
            v-if="!r.builtin && r.code !== auth.user?.role"
            v-perm="'role:manage'"
            size="small"
            round
            type="danger"
            plain
            @click="handleDelete(r)"
          >删除</el-button>
        </div>
      </el-card>

      <el-card v-if="!roles.length" class="role-card plain-card" shadow="never">
        <EmptyState title="暂无角色" description="点击右上角「添加角色」创建角色" />
      </el-card>
    </div>

    <!-- 添加/编辑角色 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? `配置角色权限 · ${form.name}` : '添加角色'" width="640px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="角色编码" required>
          <el-input v-model="form.code" placeholder="如：counselor（仅小写字母和下划线）" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" placeholder="如：辅导员" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="简要描述该角色的职责" />
        </el-form-item>
      </el-form>

      <div class="perm-tpl">
        <span class="perm-label">快速模板：</span>
        <el-button size="small" round @click="applyTemplate('admin')">管理员模板</el-button>
        <el-button size="small" round @click="applyTemplate('teacher')">教师模板</el-button>
        <el-button size="small" round @click="applyTemplate('student')">学生模板</el-button>
      </div>

      <el-divider content-position="left">页面/菜单权限</el-divider>
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        node-key="id"
        show-checkbox
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
        @check="(node, info) => (checkedMenuKeys = info.checkedKeys)"
      >
        <template #default="{ data }">
          <span style="font-size: 13px">{{ data.name }}</span>
          <code class="path-code" style="margin-left: 8px">{{ data.path }}</code>
        </template>
      </el-tree>

      <el-divider content-position="left">按钮操作权限</el-divider>
      <el-checkbox-group v-model="form.perms" class="perm-grid">
        <el-checkbox v-for="p in permOptions" :key="p.code" :value="p.code">{{ p.label }}</el-checkbox>
      </el-checkbox-group>

      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
@media (max-width: 1000px) { .role-grid { grid-template-columns: 1fr; } }

.role-card { border: none; border-radius: 14px; box-shadow: var(--shadow); }
.role-head { display: flex; align-items: center; gap: 12px; }
.role-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
}
.role-title { display: flex; flex-direction: column; line-height: 1.3; }
.role-name { font-size: 15px; font-weight: 600; color: var(--text-h); }
.role-code { font-size: 12px; color: var(--text-light); }
.role-head .el-tag { margin-left: auto; }
.role-desc {
  margin: 14px 0;
  min-height: 40px;
  font-size: 13px;
  color: var(--text);
}
.role-stats {
  display: flex;
  gap: 20px;
  padding: 12px 0;
  border-top: 1px dashed var(--border);
  font-size: 12.5px;
  color: var(--text-light);
}
.role-stats strong { color: var(--text-h); font-size: 15px; }
.role-actions { display: flex; gap: 8px; margin-top: 12px; }

.perm-tpl { margin-bottom: 6px; }
.perm-label { margin-right: 8px; font-size: 13px; color: var(--text); }

.path-code {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: #f2f6fb;
  color: var(--primary);
}
.perm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px 12px;
}
</style>
