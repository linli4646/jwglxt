import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { hasPerm } from './store/auth'

const app = createApp(App)

// Element Plus 组件库（中文语言包，表格/分页等组件显示中文）
app.use(ElementPlus, { locale: zhCn })
app.use(router)

// 按钮权限指令：v-perm="'user:add'"，无权限时直接移除该按钮
app.directive('perm', {
  mounted(el, binding) {
    if (!hasPerm(binding.value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
})

app.mount('#app')
