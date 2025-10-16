<template>
  <div class="admin-layout">
    <!-- 简单的管理后台布局 -->
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
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <main class="layout-main">
      <div class="main-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Layout',
  components: {
    // 可以在这里添加更多组件
  },
  setup() {
    // 布局组件的逻辑可以在这里添加
    return {}
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

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>