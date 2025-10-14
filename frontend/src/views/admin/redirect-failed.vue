<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-icon">
        <i class="el-icon-warning"></i>
      </div>
      <h1 class="error-title">页面跳转失败</h1>
      <p class="error-message">抱歉，无法跳转到目标页面</p>
      <p class="error-detail">系统无法将您重定向到请求的页面</p>
      <div class="error-actions">
        <el-button type="primary" @click="retryRedirect">重试</el-button>
        <el-button @click="goToDashboard">前往管理首页</el-button>
        <el-button @click="goToHome">返回系统首页</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RedirectFailed',
  data() {
    return {
      originalRedirect: ''
    }
  },
  mounted() {
    // 尝试从URL参数中获取原始重定向路径
    this.originalRedirect = this.$route.query.redirect || ''
    
    // 设置页面标题
    document.title = '跳转失败 - 管理后台'
    
    // 记录错误日志
    console.log('路由跳转失败，原始目标:', this.originalRedirect)
  },
  methods: {
    retryRedirect() {
      // 尝试重新跳转到原始目标或默认的管理后台首页
      const target = this.originalRedirect || '/admin/dashboard'
      console.log('尝试重新跳转到:', target)
      
      try {
        this.$router.push({ path: target })
      } catch (error) {
        console.error('再次跳转失败:', error)
        this.$notify({
          title: '错误',
          message: '再次跳转失败，请尝试前往管理首页',
          type: 'error',
          duration: 3000
        })
      }
    },
    goToDashboard() {
      // 跳转到管理后台首页
      this.$router.push('/admin/dashboard')
    },
    goToHome() {
      // 跳转到系统首页
      window.location.href = '/'
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
  color: #e6a23c;
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
  flex-wrap: wrap;
  gap: 10px;
}

.el-button {
  min-width: 100px;
}
</style>