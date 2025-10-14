<template>
  <div class="login-container">
    <el-form
      ref="loginForm"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">管理后台登录</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="密码"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <el-button
        :loading="loading"
        type="primary"
        style="width:100%;margin-bottom:30px;"
        @click.native.prevent="handleLogin"
      >
        登录
      </el-button>

      <div class="tips">
        <span>默认管理员账户: admin / admin123</span>
      </div>
    </el-form>
  </div>
</template>

<script>
import { adminLogin } from '@/api/admin'
import { setToken } from '@/utils/auth'

export default {
  name: 'AdminLogin',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value || value.length < 3) {
        callback(new Error('用户名长度不能少于3位'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('密码长度不能少于6位'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          console.log('开始登录请求，表单数据:', this.loginForm)
          adminLogin(this.loginForm).then(response => {
            console.log('完整响应数据:', JSON.stringify(response));
            console.log('响应数据类型:', typeof response);
            
            // 由于响应拦截器已经处理了数据格式，这里直接使用response
            // 后端返回的格式是 {token: 'xxx', user: {...}}，但经过拦截器处理后直接返回了这个对象
            console.log('token值:', response.token)
            setToken(response.token)
            
            // 设置路由守卫需要的localStorage项
            localStorage.setItem('isLoggedIn', 'true')
            console.log('设置isLoggedIn成功:', localStorage.getItem('isLoggedIn'))
            
            // 调试角色信息
            console.log('用户角色数据:', JSON.stringify(response.user?.roles));
            console.log('用户角色数据类型:', typeof response.user?.roles);
            
            // 修复：后端返回的roles可能是JSON字符串，需要先解析
            let userRoles = []
            if (response.user && response.user.roles) {
              // 如果是字符串，尝试解析为数组
              if (typeof response.user.roles === 'string') {
                try {
                  userRoles = JSON.parse(response.user.roles)
                  console.log('字符串角色解析成功:', JSON.stringify(userRoles))
                } catch (e) {
                  console.error('解析角色信息失败:', e)
                  // 如果解析失败，使用默认角色
                  userRoles = ['admin']
                  console.log('使用默认管理员角色:', userRoles)
                }
              } else if (Array.isArray(response.user.roles)) {
                // 如果已经是数组，直接使用
                userRoles = response.user.roles
                console.log('使用数组角色:', JSON.stringify(userRoles))
              } else {
                console.log('角色数据类型不是预期的数组或字符串:', typeof response.user.roles)
                userRoles = ['admin']
              }
            } else {
              console.warn('响应中没有user或roles字段，使用默认角色')
              userRoles = ['admin']
            }
            
            // 检查用户是否有管理员权限（使用英文角色名称）
            const hasAdminPermission = userRoles.some(role => {
              const roleLower = role.toLowerCase()
              console.log('检查角色:', role, ', 转换为小写:', roleLower)
              return ['admin', 'super_admin'].includes(roleLower)
            })
            
            console.log('用户角色列表:', JSON.stringify(userRoles));
            console.log('是否有管理员权限:', hasAdminPermission);
            
            // 存储用户角色信息到 localStorage
            localStorage.setItem('userRoles', JSON.stringify(userRoles))
            localStorage.setItem('hasAdminPermission', hasAdminPermission.toString())
            localStorage.setItem('hasAdminPermissionDebug', `${new Date().toISOString()} - hasAdminPermission: ${hasAdminPermission}, roles: ${JSON.stringify(userRoles)}`)
            
            console.log('localStorage中的用户角色列表:', localStorage.getItem('userRoles'))
            console.log('localStorage中的管理员权限状态:', localStorage.getItem('hasAdminPermission'))
            console.log('localStorage中的调试信息:', localStorage.getItem('hasAdminPermissionDebug'))
            
            // 执行权限检查和页面跳转
            if (hasAdminPermission) {
              // 有管理员权限，执行页面跳转
              console.log('即将跳转到:', this.redirect || '/admin/dashboard')
              
              // 使用try-catch捕获路由跳转可能出现的错误
              try {
                this.$router.push({ path: this.redirect || '/admin/dashboard' })
                
                // 显示成功通知
                this.$notify({
                  title: '成功',
                  message: '登录成功',
                  type: 'success',
                  duration: 2000
                })
              } catch (error) {
                console.error('路由跳转失败:', error)
                // 跳转到专门的跳转失败页面
                this.$router.push({ path: '/admin/redirect-failed' })
              }
            } else {
              // 没有管理员权限，显示错误并跳转到专门的权限不足页面
              console.warn('用户没有管理员权限:', JSON.stringify(userRoles))
              this.$notify({
                title: '权限不足',
                message: '您没有权限访问管理后台',
                type: 'error',
                duration: 3000
              })
              // 跳转到专门的权限不足页面，而不是选股助手界面
              this.$router.push({ path: '/admin/no-permission' })
            }
          }).catch(error => {
            console.error('登录失败:', error)
            // 详细输出错误信息
            if (error.response) {
              console.error('错误响应状态:', error.response.status)
              console.error('错误响应数据:', error.response.data)
            }
            this.loading = false
          }).finally(() => {
            // 确保无论成功或失败，loading状态都会被重置
            this.loading = false
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    }
  }
}
</script>

<style lang="css" scoped>
@supports (-webkit-mask: none) and (not (cater-color: #fff)) {
  .login-container .el-input input {
    color: #fff;
  }
}

/* reset element-ui css */
.login-container {
  min-height: 100%;
  width: 100%;
  background-color: #283443;
  overflow: hidden;
}

.login-container .el-input {
  display: inline-block;
  height: 47px;
  width: 85%;
}

.login-container .el-input input {
  background: transparent;
  border: 0px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 0px;
  padding: 12px 5px 12px 15px;
  color: #fff;
  height: 47px;
  caret-color: #fff;
}

.login-container .el-input input:-webkit-autofill {
  box-shadow: 0 0 0px 1000px #283443 inset !important;
  -webkit-text-fill-color: #fff !important;
}

.login-container .el-form-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  color: #454545;
}

.login-container .login-form {
  position: relative;
  width: 520px;
  max-width: 100%;
  padding: 160px 35px 0;
  margin: 0 auto;
  overflow: hidden;
}

.login-container .tips {
  font-size: 14px;
  color: #fff;
  margin-bottom: 10px;
}

.login-container .tips span:first-of-type {
  margin-right: 16px;
}

.login-container .svg-container {
  padding: 6px 5px 6px 15px;
  color: #889aa4;
  vertical-align: middle;
  width: 30px;
  display: inline-block;
}

.login-container .title-container {
  position: relative;
}

.login-container .title-container .title {
  font-size: 26px;
  color: #fff;
  margin: 0px auto 40px auto;
  text-align: center;
  font-weight: bold;
}

.login-container .show-pwd {
  position: absolute;
  right: 10px;
  top: 7px;
  font-size: 16px;
  color: #889aa4;
  cursor: pointer;
  user-select: none;
}
</style>