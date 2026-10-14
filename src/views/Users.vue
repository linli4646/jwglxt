<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getUsers, addUser, updateUser, deleteUser, getRoles, writeLog } from '../api/db'
import { auth, hasPerm } from '../store/auth'

const loading = ref(true)
const saving = ref(false)
const users = ref([])
const roles = ref([])

const search = ref({ keyword: '', role: '' })
const page = ref(1)
const pageSize = ref(8)

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

const roleName = computed(() => {
  const map = {}
  roles.value.forEach((r) => (map[r.code] = r.name))
  return (code) => map[code] || code
})

const filtered = computed(() => {
  let list = users.value
  const kw = search.value.keyword.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.account.toLowerCase().includes(kw) ||
        (roleName(u.role) || '').toLowerCase().includes(kw)
    )
  }
  if (search.value.role) {
    list = list.filter((u) => u.role === search.value.role)
  }
  return list
})

const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function resetSearch() {
  search.value = { keyword: '', role: '' }
  page.value = 1
}

function openAdd() {
  isEdit.value = false
  form.value = { account: '', password: '123456', name: '', role: 'student', phone: '', email: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row, password: '' }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.account || !f.name || !f.role) {
    ElMessage.warning('请填写账号、姓名并选择角色')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      const data = { name: f.name, role: f.role, phone: f.phone, email: f.email, status: f.status }
      if (f.password) data.password = f.password
      await updateUser(f.id, data)
      writeLog('修改', `修改用户「${f.name}」信息`)
      ElMessage.success('保存成功')
    } else {
      if (f.password.length < 6) {
        ElMessage.warning('密码至少 6 位')
        return
      }
      await addUser({ account: f.account, name: f.name, role: f.role, phone: f.phone, email: f.email, status: f.status, password: f.password })
      writeLog('新增', `新增用户「${f.name}」（${f.account}）`)
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

async function toggleStatus(row) {
  const action = row.status === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      row.id === auth.user?.id && row.status === 1
        ? '禁用自己后将被强制下线，确定继续吗？'
        : `确定${action}用户「${row.name}」吗？`,
      '操作确认',
      { type: 'warning' }
    )
  } catch {
    return // 用户取消，状态不变
  }
  await updateUser(row.id, { status: row.status === 1 ? 0 : 1 })
  writeLog('修改', `${action}用户「${row.name}」`)
  ElMessage.success(`已${action}`)
  await load()
}

async function handleDelete(row) {
  if (row.id === auth.user?.id) {
    ElMessage.warning('不能删除当前登录的账号')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.name}」吗？删除后不可恢复。`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteUser(row.id)
  writeLog('删除', `删除用户「${row.name}」`)
  ElMessage.success('删除成功')
  await load()
}

async function load() {
  loading.value = true
  try {
    const [u, r] = await Promise.all([getUsers(), getRoles()])
    users.value = u
    roles.value = r
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
        <h2 class="page-title">用户管理</h2>
        <p class="page-sub">管理系统用户账号，支持搜索、分页与启用/禁用</p>
      </div>
      <div>
        <el-button v-perm="'user:add'" type="primary" round @click="openAdd">
          <el-icon style="margin-right: 6px"><Icons.Plus /></el-icon>添加用户
        </el-button>
      </div>
    </div>

    <el-card class="plain-card" shadow="never">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="search.keyword"
            placeholder="按姓名 / 账号 / 角色搜索"
            clearable
            style="width: 260px"
            @keyup.enter="page = 1"
          >
            <template #prefix><el-icon><Icons.Search /></el-icon></template>
          </el-input>
          <el-select v-model="search.role" placeholder="全部角色" clearable style="width: 150px">
            <el-option v-for="r in roles" :key="r.code" :label="r.name" :value="r.code" />
          </el-select>
          <el-button type="primary" round @click="page = 1">查询</el-button>
          <el-button round @click="resetSearch">重置</el-button>
        </div>
        <el-button round :icon="Icons.Refresh" circle @click="load" />
      </div>

      <!-- 表格 / 骨架屏 / 空状态 -->
      <SkeletonTable v-if="loading" :rows="6" :cols="5" />
      <template v-else>
        <el-table :data="paged" style="width: 100%">
          <el-table-column label="用户" min-width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <span class="mini-avatar" :style="{ background: row.role === 'super_admin' ? 'linear-gradient(135deg,#7c4dff,#5b7cfa)' : row.role === 'admin' ? 'linear-gradient(135deg,#1b87db,#3a7bd5)' : row.role === 'teacher' ? 'linear-gradient(135deg,#00b578,#52c41a)' : 'linear-gradient(135deg,#ff9f43,#f7b500)' }">
                  {{ row.name.slice(0, 1) }}
                </span>
                <div>
                  <div class="cell-name">{{ row.name }}</div>
                  <div class="cell-sub">@{{ row.account }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="120" align="center">
            <template #default="{ row }">
              <el-tag round effect="light" :type="row.role === 'super_admin' ? 'danger' : row.role === 'admin' ? 'primary' : row.role === 'teacher' ? 'success' : 'warning'">
                {{ roleName(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" width="130" align="center">
            <template #default="{ row }">{{ row.phone || '—' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status === 1"
                :disabled="!hasPerm('user:toggle')"
                @change="toggleStatus(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="最近登录" min-width="150" align="center">
            <template #default="{ row }">{{ row.lastLogin || '从未登录' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button v-perm="'user:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
              <el-button v-perm="'user:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState title="没有找到用户" :description="search.keyword || search.role ? '换个搜索条件试试' : '点击右上角「添加用户」创建账号'" />
          </template>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="filtered.length"
            :page-sizes="[8, 15, 30]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </template>
    </el-card>

    <!-- 添加 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="480px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="账号" required>
          <el-input v-model="form.account" placeholder="登录账号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item :label="isEdit ? '重置密码' : '密码'" :required="!isEdit">
          <el-input v-model="form.password" :placeholder="isEdit ? '留空则不修改密码' : '至少 6 位'" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.code" :label="`${r.name}（${r.code}）`" :value="r.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.toolbar-left { display: flex; gap: 10px; flex-wrap: wrap; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.mini-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.cell-name { font-size: 14px; font-weight: 600; color: var(--text-h); line-height: 1.3; }
.cell-sub { font-size: 12px; color: var(--text-light); }

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
