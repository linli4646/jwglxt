<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
import EmptyState from '../components/EmptyState.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import { getMenus, getRoles, addMenu, updateMenu, deleteMenu, writeLog } from '../api/db'

const loading = ref(true)
const saving = ref(false)
const menus = ref([])
const roles = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})

const iconOptions = ['House', 'User', 'UserFilled', 'School', 'Reading', 'Calendar', 'Bell', 'Tools', 'Menu', 'Key', 'Document', 'Setting', 'Avatar', 'DataLine', 'Message', 'EditPen', 'Folder']

const roleName = computed(() => {
  const map = {}
  roles.value.forEach((r) => (map[r.code] = r.name))
  return (codes) => (codes || []).map((c) => map[c] || c).join('、')
})

const tree = computed(() => {
  const list = menus.value.map((m) => ({ ...m }))
  const map = {}
  list.forEach((m) => (map[m.id] = m))
  const roots = []
  list.forEach((m) => {
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children = map[m.parentId].children || []
      map[m.parentId].children.push(m)
    } else {
      roots.push(m)
    }
  })
  const sortRec = (arr) => {
    arr.sort((a, b) => a.order - b.order)
    arr.forEach((x) => x.children && sortRec(x.children))
  }
  sortRec(roots)
  return roots
})

const parentOptions = computed(() =>
  menus.value.filter((m) => !m.parentId).map((m) => ({ label: m.name, value: m.id }))
)

function openAdd(parentId = null) {
  isEdit.value = false
  form.value = { name: '', path: '', icon: 'Menu', parentId, order: 1, hidden: 0, roles: ['super_admin', 'admin', 'teacher', 'student'], type: 1 }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row, roles: [...row.roles] }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.name) {
    ElMessage.warning('请填写菜单名称')
    return
  }
  if (f.type === 1 && !f.path) {
    ElMessage.warning('请填写路由路径')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateMenu(f.id, {
        name: f.name, path: f.path, icon: f.icon, parentId: f.parentId === f.id ? null : f.parentId,
        order: f.order, hidden: f.hidden ? 1 : 0, roles: f.roles, type: f.type
      })
      writeLog('修改', `修改菜单「${f.name}」`)
      ElMessage.success('保存成功')
    } else {
      await addMenu({
        name: f.name, path: f.path, icon: f.icon, parentId: f.parentId,
        order: f.order, hidden: f.hidden ? 1 : 0, roles: f.roles, type: f.type
      })
      writeLog('新增', `新增菜单「${f.name}」`)
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

async function toggleHidden(row) {
  await updateMenu(row.id, { hidden: row.hidden ? 0 : 1 })
  writeLog('修改', `${row.hidden ? '显示' : '隐藏'}菜单「${row.name}」`)
  ElMessage.success(row.hidden ? '菜单已显示' : '菜单已隐藏')
  await load()
}

async function handleDelete(row) {
  const childCount = menus.value.filter((m) => m.parentId === row.id).length
  const tip = childCount ? `其下 ${childCount} 个子菜单将一并删除。` : ''
  try {
    await ElMessageBox.confirm(`确定删除菜单「${row.name}」吗？${tip}`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteMenu(row.id)
  writeLog('删除', `删除菜单「${row.name}」`)
  ElMessage.success('删除成功')
  await load()
}

async function load() {
  loading.value = true
  try {
    const [m, r] = await Promise.all([getMenus(), getRoles()])
    menus.value = m
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
        <h2 class="page-title">菜单管理</h2>
        <p class="page-sub">配置侧边栏菜单与路由权限，隐藏的菜单不出现在导航中</p>
      </div>
      <el-button v-perm="'menu:manage'" type="primary" round @click="openAdd()">
        <el-icon style="margin-right: 6px"><Icons.Plus /></el-icon>添加菜单
      </el-button>
    </div>

    <el-card class="plain-card" shadow="never">
      <SkeletonTable v-if="loading" :rows="6" :cols="4" />
      <template v-else>
        <el-table :data="tree" row-key="id" default-expand-all :tree-props="{ children: 'children' }" style="width: 100%">
          <el-table-column label="菜单名称" min-width="220">
            <template #default="{ row }">
              <span class="menu-name">
                <el-icon style="margin-right: 8px"><component :is="Icons[row.icon] || Icons.Menu" /></el-icon>
                {{ row.name }}
                <el-tag v-if="row.type === 2" size="small" round effect="plain" style="margin-left: 8px">按钮</el-tag>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路由路径" min-width="150">
            <template #default="{ row }">
              <code class="path-code">{{ row.path || '—' }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="order" label="排序" width="80" align="center" />
          <el-table-column label="授权角色" min-width="220">
            <template #default="{ row }">
              <el-tag v-for="r in row.roles" :key="r" size="small" round effect="plain" style="margin-right: 4px">
                {{ roleName([r]) }}
              </el-tag>
              <span v-if="!row.roles.length" class="cell-sub">未授权任何角色</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag round size="small" effect="light" :type="row.hidden ? 'info' : 'success'">
                {{ row.hidden ? '隐藏' : '显示' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="330" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button v-perm="'menu:manage'" size="small" round type="primary" plain @click="openAdd(row.id)">加子菜单</el-button>
                <el-button v-perm="'menu:manage'" size="small" round @click="openEdit(row)">编辑</el-button>
                <el-button v-perm="'menu:manage'" size="small" round plain @click="toggleHidden(row)">{{ row.hidden ? '显示' : '隐藏' }}</el-button>
                <el-button v-perm="'menu:manage'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState title="暂无菜单" description="点击右上角「添加菜单」创建菜单" />
          </template>
        </el-table>
      </template>
    </el-card>

    <!-- 添加/编辑菜单 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '添加菜单'" width="520px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="菜单类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" required>
          <el-input v-model="form.name" placeholder="如：用户管理" />
        </el-form-item>
        <el-form-item label="路由路径" v-if="form.type === 1">
          <el-input v-model="form.path" placeholder="如：/users（需与前端路由一致）" />
        </el-form-item>
        <el-form-item label="上级菜单">
          <el-select v-model="form.parentId" placeholder="顶级菜单" clearable style="width: 100%">
            <el-option v-for="p in parentOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="form.icon" style="width: 100%">
            <el-option v-for="i in iconOptions" :key="i" :label="i" :value="i">
              <span style="display: flex; align-items: center; gap: 8px">
                <el-icon><component :is="Icons[i]" /></el-icon>{{ i }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.order" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="授权角色">
          <el-checkbox-group v-model="form.roles">
            <el-checkbox v-for="r in roles" :key="r.code" :value="r.code">{{ r.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="是否隐藏">
          <el-switch v-model="form.hidden" :active-value="1" :inactive-value="0" />
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
.menu-name {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  color: var(--text-h);
}
.path-code {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #f2f6fb;
  color: var(--primary);
}
.cell-sub { font-size: 12px; color: var(--text-light); }
.action-buttons {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}
.action-buttons :deep(.el-button + .el-button) { margin-left: 0; }
</style>
