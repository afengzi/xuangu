<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>选股助手</h2>
        <p>股票筛选分析系统</p>
      </div>
      
      <el-form 
        :model="loginForm" 
        :rules="rules" 
        ref="loginFormRef"
        class="login-form"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.rememberMe">
            记住我
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
            size="large"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginFormRef = ref()
    const loading = ref(false)
    
    // 登录表单数据
    const loginForm = reactive({
      username: '',
      password: '',
      rememberMe: false
    })
    
    // 表单验证规则
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    // 处理登录
    const handleLogin = async () => {
      if (!loginFormRef.value) return
      
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        loading.value = true
        
        // 使用配置好的API服务，而不是硬编码URL
        const response = await axios.post('/api/login', loginForm)
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('username', loginForm.username)
          localStorage.setItem('loginTime', new Date().toISOString())
          // 存储用户角色信息
          if (response.data.user && response.data.user.roles) {
            localStorage.setItem('userRoles', JSON.stringify(response.data.user.roles))
          }
          // 存储角色详细信息
          if (response.data.user && response.data.user.role_details) {
            localStorage.setItem('userRoleDetails', JSON.stringify(response.data.user.role_details))
          }
          // 存储用户邮箱
          if (response.data.user && response.data.user.email) {
            localStorage.setItem('userEmail', response.data.user.email)
            // 触发自定义事件通知邮箱更新
            window.dispatchEvent(new CustomEvent('localStorageChanged', {
              detail: { key: 'userEmail', value: response.data.user.email }
            }))
          }
          ElMessage.success('登录成功！')
          router.push('/stock-filter')
        } else {
          ElMessage.error('登录失败，请检查用户名和密码')
        }
        
      } catch (error) {
        console.error('登录错误:', error)
        if (error.response?.status === 401) {
          // 显示后端返回的具体错误信息
          const errorMessage = error.response?.data?.error || '用户名或密码错误'
          ElMessage.error(errorMessage)
        } else if (error.response?.status === 403) {
          ElMessage.error('没有权限登录系统')
        } else {
          ElMessage.error('登录失败，请重试')
        }
      } finally {
        loading.value = false
      }
    }
    
    return {
      loginForm,
      rules,
      loginFormRef,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 50%, #fff3e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 10px 25px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 32px 40px;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-header h2 {
  color: #1e293b;
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #64748b;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.login-form {
  margin-top: 16px;
}

.login-form .el-form-item {
  margin-bottom: 18px;
}

.login-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 0;
  }
  
  .login-box {
    padding: 24px 20px;
    max-width: 340px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
  
  .login-header {
    margin-bottom: 20px;
  }
  
  .login-form .el-form-item {
    margin-bottom: 16px;
  }
}
</style>