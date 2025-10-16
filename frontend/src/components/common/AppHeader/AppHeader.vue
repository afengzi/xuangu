<template>
  <el-header class="app-header">
    <div class="header-container">
      <div class="header-left app-left">
        <h2 class="app-title">选股助手</h2>
      </div>
      <div class="header-right app-right">
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ currentUser }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, ArrowDown, SwitchButton } from '@element-plus/icons-vue'

export default {
  name: 'AppHeader',
  components: {
    User,
    ArrowDown,
    SwitchButton
  },
  emits: ['logout', 'show-profile'],
  setup(props, { emit }) {
    const router = useRouter()
    
    // 获取当前用户信息
    const currentUser = computed(() => localStorage.getItem('username') || '用户')
    
    // 处理下拉菜单命令
    const handleCommand = async (command) => {
      if (command === 'profile') {
        // 显示个人信息面板
        emit('show-profile')
      } else if (command === 'logout') {
        try {
          await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          })
          
          // 清除登录状态
          localStorage.removeItem('isLoggedIn')
          localStorage.removeItem('username')
          
          ElMessage.success('已退出登录')
          router.push('/login')
          
          // 通知父组件
          emit('logout')
        } catch (error) {
          // 用户取消退出
        }
      }
    }
    
    return {
      currentUser,
      handleCommand
    }
  }
}
</script>

<style scoped>
@import './styles/index.css';
</style>
