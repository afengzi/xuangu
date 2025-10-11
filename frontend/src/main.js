import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入所有图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 引入主样式文件
import './styles/main.css'

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册Vue Router
app.use(router)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')