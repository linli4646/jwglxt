# 教务管理系统（Vue 3 + Vite + Element Plus）

## 启动

```bash
npm install
npm run dev
```

## Supabase 数据接入说明

项目通过 axios 直连 Supabase 的 REST API，读写云端的 `xuesheng`（学生）表。

| 文件 | 作用 |
| ---- | ---- |
| `src/api/xuesheng.js` | Supabase 接口封装（URL / key 配置 + 增删改查函数） |
| `src/components/XueshengList.vue` | 学生信息表格组件（表格展示 + 添加/编辑/删除） |

数据表字段：`id`（学号）、`name`（姓名）、`class`（班级）、`age`（年龄）。

注意事项：

- `xuesheng` 表的 id 自增序列与已有数据不同步，不传 id 直接插入会报主键重复，
  所以添加学生时前端会自动预填「当前最大 id + 1」。
- 使用的 key 是 publishable key（可公开用于前端），数据权限由 Supabase 服务端的
  RLS 策略控制，如需更换配置直接修改 `src/api/xuesheng.js` 顶部的常量即可。
