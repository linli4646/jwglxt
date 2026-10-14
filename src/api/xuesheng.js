// Supabase 数据接口封装：用 axios 直接访问 Supabase 的 REST API（PostgREST 风格）
// 对应数据表：xuesheng（字段：id / name / class / age）
import axios from 'axios'

// Supabase 项目配置
// publishable key 本身就是给前端公开使用的，真正的数据权限由服务端 RLS 策略控制
const SUPABASE_URL = 'https://nbyvjjlwymmdjhhrefpe.supabase.co/rest/v1/'
const SUPABASE_KEY = 'sb_publishable_Mc5gajN2IFbWl4K9xfa3cg_yPGPeI4p'

// Supabase 要求每个请求都携带 apikey 和 Authorization 两个请求头，
// 这里统一在 axios 实例里配置，业务代码不用重复写
const request = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
})

// 查询全部学生：select=* 取所有字段，order=id.asc 按学号升序
export function getAllStudents() {
  return request.get('/xuesheng?select=*&order=id.asc')
}

// 新增学生
// 注意：该表的 id 自增序列与现有数据不同步，不传 id 插入会报主键重复错误，
// 所以新增时必须显式传 id（组件里会自动预填“当前最大 id + 1”）
export function addStudent(data) {
  return request.post('/xuesheng', data, {
    headers: { Prefer: 'return=representation' }
  })
}

// 按 id 修改学生：?id=eq.xxx 是 PostgREST 的行过滤写法，表示只更新匹配的行
export function updateStudent(id, data) {
  return request.patch(`/xuesheng?id=eq.${id}`, data, {
    headers: { Prefer: 'return=representation' }
  })
}

// 按 id 删除学生
export function deleteStudent(id) {
  return request.delete(`/xuesheng?id=eq.${id}`)
}
