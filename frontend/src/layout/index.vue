<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <header class="layout-header">
      <div class="header-content">
        <div class="header-left">
          <h1>选股助手 - 管理后台</h1>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-name">管理员</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <!-- 主体内容区域 -->
    <main class="layout-main">
      <!-- 左侧边栏 -->
      <aside class="layout-sidebar">
        <!-- 左侧导航菜单 -->
        <div class="sidebar-header" v-if="!isCollapse">
          <h3>管理菜单</h3>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
          :collapse="isCollapse"
          router
          :unique-opened="false"
          menu-trigger="hover"
        >
          <el-menu-item index="/admin/dashboard" class="menu-item">
            <template #title>
              <div class="menu-item-content">
                <el-icon><DataAnalysis /></el-icon>
                <span class="menu-text">仪表盘</span>
              </div>
            </template>
          </el-menu-item>
          
          <el-menu-item index="/admin/users" class="menu-item">
            <template #title>
              <div class="menu-item-content">
                <el-icon><User /></el-icon>
                <span class="menu-text">用户管理</span>
              </div>
            </template>
          </el-menu-item>
          
          <el-menu-item index="/admin/roles" class="menu-item">
            <template #title>
              <div class="menu-item-content">
                <el-icon><Avatar /></el-icon>
                <span class="menu-text">角色管理</span>
              </div>
            </template>
          </el-menu-item>
          
          <el-menu-item index="/admin/permissions" class="menu-item">
            <template #title>
              <div class="menu-item-content">
                <el-icon><Lock /></el-icon>
                <span class="menu-text">权限管理</span>
              </div>
            </template>
          </el-menu-item>
        </el-menu>
        
        <!-- 折叠按钮 -->
        <div class="sidebar-collapse" @click="toggleCollapse">
          <el-icon><component :is="isCollapse ? 'Expand' : 'Fold'" /></el-icon>
        </div>
      </aside>
      
      <!-- 右侧内容区域 -->
      <section class="layout-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { DataAnalysis, User, Avatar, Lock, Expand, Fold } from '@element-plus/icons-vue'

export default {
  name: 'Layout',
  components: {
    DataAnalysis,
    User,
    Avatar,
    Lock,
    Expand,
    Fold
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isCollapse = ref(false)
    
    // 计算当前激活的菜单项
    const activeMenu = computed(() => {
      return route.path
    })
    
    // 切换侧边栏折叠状态
    const toggleCollapse = () => {
      isCollapse.value = !isCollapse.value
    }
    
    // 处理退出登录
    const handleLogout = () => {
      // 清除所有登录状态
      localStorage.removeItem('admin_token')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userRoles')
      localStorage.removeItem('hasAdminPermission')
      
      ElMessage.success('退出登录成功')
      
      // 跳转到登录页
      router.push('/admin/login')
    }
    
    return {
      isCollapse,
      activeMenu,
      toggleCollapse,
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.layout-header {
  background-color: #1890ff;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-left h1 {
  font-size: 18px;
  margin: 0;
  font-weight: 500;
  font-family: inherit;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.user-name {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
  font-size: 18px;
  font-weight: 500;
  font-family: inherit;
  color: white;
}

.user-name:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧边栏样式 */
.layout-sidebar {
  width: 200px;
  background-color: #001529;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  position: relative;
}

/* 侧边栏标题 */
.sidebar-header {
  padding: 16px 20px;
  background-color: #002140;
  border-bottom: 1px solid #0d1a2f;
}

.sidebar-header h3 {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  text-align: center;
  letter-spacing: 1px;
}

.layout-sidebar.collapsed {
  width: 64px;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu .menu-item {
  height: 50px;
  line-height: 50px;
  border-radius: 0;
  margin: 0;
  border-bottom: 1px solid #0d1a2f;
  display: flex;
  align-items: center;
  padding: 0 20px !important;
}

.sidebar-menu .menu-item .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

.sidebar-menu .menu-item span {
  font-size: 14px;
  font-weight: 500;
}

.sidebar-menu .menu-item:hover {
  background-color: #1890ff !important;
}

.sidebar-menu .menu-item.is-active {
  background-color: #1890ff !important;
  border-right: 3px solid #fff;
}

/* 折叠状态下的菜单项样式 */
.layout-sidebar.collapsed .sidebar-menu .menu-item {
  padding: 0 20px !important;
  justify-content: center;
}

.layout-sidebar.collapsed .sidebar-menu .menu-item span {
  display: none;
}

/* 确保菜单项文字始终可见 */
.sidebar-menu .el-menu-item__title {
  display: flex !important;
  align-items: center;
  height: 100%;
  width: 100%;
}

/* 修复Element Plus菜单项文字显示 */
.sidebar-menu .el-menu-item > div {
  display: flex !important;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* 菜单项内容容器 */
.menu-item-content {
  display: flex !important;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 8px;
}

/* 菜单文字样式 */
.menu-text {
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #fff !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 折叠按钮 */
.sidebar-collapse {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background-color: #002140;
  border-top: 1px solid #0d1a2f;
  transition: background-color 0.3s;
}

.sidebar-collapse:hover {
  background-color: #1890ff;
}

/* 右侧内容区域 */
.layout-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .layout-sidebar.show {
    transform: translateX(0);
  }
  
  .layout-content {
    padding: 10px;
  }
}
</style>