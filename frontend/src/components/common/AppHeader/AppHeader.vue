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
              <el-dropdown-item command="logout">
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
  emits: ['logout'],
  setup(props, { emit }) {
    const router = useRouter()
    
    // 获取当前用户信息
    const currentUser = computed(() => localStorage.getItem('username') || '用户')
    
    // 处理下拉菜单命令
    const handleCommand = async (command) => {
      if (command === 'logout') {
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
.app-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0; /* 去除默认左右内边距，使内容可贴边 */
}

.header-container {
  max-width: none; /* 取消居中限制，铺满全宽 */
  width: 100%;
  margin: 0; /* 不再居中 */
  padding: 0; /* 去除左右留白 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.app-title {
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 让左右两端贴边 */
.app-left {
  padding-left: 12px; /* 轻微内边距，避免紧贴浏览器边缘 */
}
.app-right {
  padding-right: 12px;
}

.user-info {
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.user-info:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #3b82f6;
  transform: translateY(-1px);
}
</style>
