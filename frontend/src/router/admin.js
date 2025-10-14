import Layout from '@/layout/index.vue'

const adminRoutes = [
  {
    path: '/admin/no-permission',
    name: 'NoPermission',
    component: () => import('@/views/admin/no-permission.vue'),
    meta: {
      title: '无权限访问',
      requiresAuth: false
    }
  },
  {
    path: '/admin/redirect-failed',
    name: 'RedirectFailed',
    component: () => import('@/views/admin/redirect-failed.vue'),
    meta: {
      title: '跳转失败',
      requiresAuth: false
    }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/login.vue'),
    meta: {
      title: '管理后台登录',
      requiresAuth: false
    }
  },
  {
    path: '/admin',
    component: Layout,
    redirect: '/admin/dashboard',
    name: 'Admin',
    meta: {
      title: '管理后台',
      icon: 'lock',
      roles: ['admin', 'super_admin']
    },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard.vue'),
        meta: {
          title: '仪表盘',
          icon: 'dashboard'
        }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/admin/users.vue'),
        meta: {
          title: '用户管理',
          icon: 'user',
          permission: 'user:list'
        }
      },
      {
        path: 'roles',
        name: 'RoleManagement',
        component: () => import('@/views/admin/roles.vue'),
        meta: {
          title: '角色管理',
          icon: 'peoples',
          permission: 'role:list'
        }
      },
      {
        path: 'permissions',
        name: 'PermissionManagement',
        component: () => import('@/views/admin/permissions.vue'),
        meta: {
          title: '权限管理',
          icon: 'lock',
          permission: 'permission:list'
        }
      }
    ]
  }
]

export default adminRoutes