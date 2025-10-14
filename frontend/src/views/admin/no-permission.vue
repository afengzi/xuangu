<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-icon">
        <i class="el-icon-lock"></i>
      </div>
      <h1 class="error-title">无权限访问</h1>
      <p class="error-message">抱歉，您没有权限访问管理后台</p>
      <p class="error-detail">您当前的角色: <strong>{{ userRolesDisplay }}</strong></p>
      <div class="error-actions">
        <el-button type="primary" @click="goToHome">返回首页</el-button>
        <el-button @click="goToLogin">重新登录</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoPermission',
  data() {
    return {
      userRolesDisplay: '未登录',
      hasAdminPermission: false,
      debugInfo: ''
    }
  },
  mounted() {
    // 获取当前用户角色信息
    try {
      const userRolesJson = localStorage.getItem('userRoles')
      if (userRolesJson) {
        const userRoles = JSON.parse(userRolesJson)
        this.userRolesDisplay = Array.isArray(userRoles) ? userRoles.join(', ') : userRoles
      }
      this.hasAdminPermission = localStorage.getItem('hasAdminPermission') === 'true'
      this.debugInfo = localStorage.getItem('hasAdminPermissionDebug') || '无调试信息'
    } catch (e) {
      console.error('解析用户角色信息失败:', e)
    }
    
    // 设置页面标题
    document.title = '无权限访问 - 管理后台'
    
    // 详细访问日志
    console.log('用户无权访问管理后台')
    console.log('- 角色列表:', this.userRolesDisplay)
    console.log('- 权限状态:', this.hasAdminPermission)
    console.log('- 调试信息:', this.debugInfo)
  },
  methods: {
    goToHome() {
      // Redirect to system home page
      window.location.href = '/'
    },
    goToLogin() {
      // Clear all login state information
      localStorage.removeItem('admin_token')
      localStorage.removeItem('userRole') // Compatibility with older versions
      localStorage.removeItem('userRoles') // New version
      localStorage.removeItem('hasAdminPermission') // New version
      localStorage.removeItem('hasAdminPermissionDebug') // Debug information
      localStorage.removeItem('isLoggedIn')
      // Redirect to admin login page
      this.$router.push('/admin/login')
    }
  }
}
</script>

<style lang="css" scoped>
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.error-content {
  text-align: center;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
  font-weight: 600;
}

.error-message {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.error-detail {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.el-button {
  min-width: 100px;
}
</style>