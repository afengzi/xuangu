import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'element-vendor': ['element-plus', '@element-plus/icons-vue'],
          'utils': ['axios']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false
      },
      // 将 /legacy 交给后端 Flask 提供的模板，避免在开发环境被前端路由拦截导致刷新循环
      '/legacy': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false
      },
      // 代理共享配置文件
      '/shared': {
        target: 'http://0.0.0.0:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/shared/, '/../shared')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@shared': resolve(process.cwd(), '../shared')
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'element-plus', 'axios']
  },
  css: {
    devSourcemap: false
  }
})
