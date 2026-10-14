<template>
  <!-- 学生信息表：数据来自 Supabase 的 xuesheng 表，支持增删改查 -->
  <div class="xuesheng">
    <el-card class="table-card plain-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-title">
            <span class="title-text">学生信息管理</span>
            <span class="count-badge">共 {{ students.length }} 人</span>
          </div>
          <div>
            <el-button v-perm="'student:add'" type="primary" round @click="openAdd">添加学生</el-button>
            <el-button round @click="loadStudents">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 骨架屏 -->
      <SkeletonTable v-if="loading" :rows="6" :cols="5" />

      <!-- 表格 -->
      <template v-else>
        <el-table :data="pagedStudents" style="width: 100%">
          <el-table-column prop="id" label="学号" width="100" align="center" />
          <el-table-column prop="name" label="姓名" min-width="140">
            <template #default="{ row }">
              <span class="name-cell">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="class" label="班级" width="140" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.class" effect="light" round>{{ row.class }} 班</el-tag>
              <span v-else class="cell-sub">未分班</span>
            </template>
          </el-table-column>
          <el-table-column prop="age" label="年龄" width="100" align="center" />
          <el-table-column v-if="!readOnly" label="操作" width="170" align="center">
            <template #default="{ row }">
              <el-button v-perm="'student:edit'" size="small" round @click="openEdit(row)">编辑</el-button>
              <el-button v-perm="'student:delete'" size="small" type="danger" plain round @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState
              title="暂无学生数据"
              description="数据来自 Supabase，确认网络连接或先添加一名学生"
              :action-text="readOnly ? '' : '添加学生'"
              @action="openAdd"
            />
          </template>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="students.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </template>
    </el-card>

    <!-- 添加 / 编辑共用的弹窗表单 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学生' : '添加学生'" width="420px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="学号">
          <el-input-number
            v-model="form.id"
            :min="1"
            :disabled="isEdit"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="班级">
          <el-input-number v-model="form.class" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="form.age" :min="1" :max="150" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button round @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SkeletonTable from './SkeletonTable.vue'
import EmptyState from './EmptyState.vue'
import {
  getAllStudents,
  addStudent,
  updateStudent,
  deleteStudent
} from '../api/xuesheng'
import { writeLog } from '../api/db'

defineProps({
  readOnly: { type: Boolean, default: false }
})

const students = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = ref({ id: null, name: '', class: null, age: null })
const page = ref(1)
const pageSize = ref(10)

const pagedStudents = computed(() => students.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

async function loadStudents() {
  loading.value = true
  try {
    const { data } = await getAllStudents()
    students.value = data
    if ((page.value - 1) * pageSize.value >= students.value.length) page.value = 1
  } catch (e) {
    ElMessage.error('加载学生数据失败：' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  const maxId = students.value.reduce((max, s) => Math.max(max, s.id), 0)
  form.value = { id: maxId + 1, name: '', class: null, age: null }
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSave() {
  const f = form.value
  if (!f.id || !f.name || f.class === null || f.age === null) {
    ElMessage.warning('请填写完整后再保存')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateStudent(f.id, { name: f.name, class: f.class, age: f.age })
      writeLog('修改', `修改学生「${f.name}」信息`)
      ElMessage.success('修改成功')
    } else {
      await addStudent({ id: f.id, name: f.name, class: f.class, age: f.age })
      writeLog('新增', `新增学生「${f.name}」`)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await loadStudents()
  } catch (e) {
    ElMessage.error('保存失败：' + (e.response?.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除学生「${row.name}」（学号 ${row.id}）吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await deleteStudent(row.id)
    writeLog('删除', `删除学生「${row.name}」`)
    ElMessage.success('删除成功')
    await loadStudents()
  } catch (e) {
    ElMessage.error('删除失败：' + (e.response?.data?.message || e.message))
  }
}

onMounted(loadStudents)
</script>

<style scoped>
.xuesheng {
  text-align: left;
}

.table-card {
  border: none;
  border-radius: 14px;
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  position: relative;
  padding-left: 14px;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-h);
}
.title-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: var(--primary);
}

.count-badge {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-light);
}

.name-cell { font-weight: 600; color: var(--text-h); }
.cell-sub { font-size: 12px; color: var(--text-light); }

:deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
}
:deep(.el-table__header th) {
  background: #f5f8fc;
  color: #33445c;
  font-weight: 600;
}
:deep(.el-table__row) {
  transition: background-color 0.2s;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .xuesheng {
    margin: 14px 10px 20px;
  }
}
</style>
