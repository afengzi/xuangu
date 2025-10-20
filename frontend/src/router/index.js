import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import StockFilter from '../views/StockFilter.vue'
import adminRoutes from './admin.js'

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
  },
  // 导入管理后台路由
  ...adminRoutes
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
  const isAdminRoute = to.path.startsWith('/admin/') && to.path !== '/admin/login'
  
  // 获取用户角色和权限信息
  const userRolesJson = localStorage.getItem('userRoles')
  const hasAdminPermission = localStorage.getItem('hasAdminPermission') === 'true'
  
  // 为了安全起见，再次检查角色信息
  let userRoles = []
  try {
    if (userRolesJson) {
      userRoles = JSON.parse(userRolesJson)
    }
    // Additional security check: If hasAdminPermission is false but user has admin or super_admin role, correct it
      const hasActualAdminPermission = userRoles.some(role => 
        ['admin', 'super_admin'].includes(role.toLowerCase())
      )
      if (hasActualAdminPermission && !hasAdminPermission) {
        console.warn('发现权限状态不一致，实际有管理员权限但状态标志为false，已纠正')
        localStorage.setItem('hasAdminPermission', 'true')
      }
    } catch (e) {
      console.error('解析用户角色列表失败:', e)
    }
  
  // 检查是否是管理后台路由且不是登录页面
  if (isAdminRoute) {
    // 特殊处理：如果是无权限访问或跳转失败页面，允许访问
    if (to.path === '/admin/no-permission' || to.path === '/admin/redirect-failed') {
      console.log('访问特殊错误页面，允许访问')
      next()
    } else if (!isLoggedIn) {
      console.log('未登录，跳转到管理后台登录页')
      next('/admin/login')
    } else if (!hasAdminPermission) {
      console.log('已登录但没有管理员权限，重定向到无权限页面')
      next('/admin/no-permission')
    } else {
      console.log('已登录且有管理员权限，继续访问')
      next()
    }
  } else if (requiresAuth && !isLoggedIn) {
    console.log('需要登录但未登录，跳转到普通登录页')
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    console.log('已登录但访问普通登录页，跳转到首页')
    next('/')
  } else {
    console.log('无需特殊处理，继续访问')
    next()
  }
  // 详细调试日志 - 结束
})

export default router