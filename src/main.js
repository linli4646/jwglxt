import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

// 修复说明：原文件中存在两段被拼接在一起的重复启动代码
// （重复 import、重复 createApp().mount('#app')），会破坏依赖预构建并导致挂载异常。
// 现合并为一次标准的 Vue 应用初始化。
const app = createApp(App)

// 注册 Element Plus 组件库
app.use(ElementPlus)

app.mount('#app')
