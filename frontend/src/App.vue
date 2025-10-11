<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { preloadThemesData } from './utils/themesCache.js'
import { getAllThemes } from './api/stockAPI.js'
import { memoryMonitor } from './utils/memoryMonitor.js'

export default {
  name: 'App',
  setup() {
    // 应用启动时预加载题材数据（确保界面刷新时有数据）
    onMounted(async () => {
      // 同步预加载，确保热门概念界面有数据
      await preloadThemesData(getAllThemes).catch(error => {
        console.warn('预加载题材数据失败:', error)
      })

      // 添加内存监控观察者
      memoryMonitor.addObserver('app', (data) => {
        if (data.type === 'cleanup') {
          console.log('应用收到内存清理通知:', data.level)
          // 可以在这里触发应用级别的内存清理
        }
      })
    })
  }
}

</script>

<style>
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #1f2937;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

body {
  margin: 0;
  padding: 0;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

::-webkit-scrollbar-track {
  background: #f8fafc;
}
</style>