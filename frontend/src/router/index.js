import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import StockFilter from '../views/StockFilter.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录 - 选股助手'
    }
  },
  {
    path: '/stock-filter',
    name: 'StockFilter',
    component: StockFilter,
    meta: {
      requiresAuth: true,
      title: '股票筛选 - 选股助手'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  if (requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录但访问登录页，跳转到股票筛选页
    next('/stock-filter')
  } else {
    next()
  }
})

export default router 