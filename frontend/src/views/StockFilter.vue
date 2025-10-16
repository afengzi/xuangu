<template>
  <div class="stock-filter-page">
    <!-- 导航栏组件 -->
    <AppHeader @logout="handleLogout" @show-profile="handleShowProfile" />

    <!-- 主要内容区域 -->
    <div class="page-content">
      <el-row :gutter="20">
        <!-- 筛选面板 -->
        <el-col :span="24">
          <FilterPanel 
            @filter-change="handleFilterChange"
          />
        </el-col>
      </el-row>

      <!-- 股票表格组件 -->
      <StockTable
        :stock-list="stockList"
        :is-theme-mode="isThemeMode"
        :theme-columns="themeColumns"
        :data-columns="dataColumns"
        :show-time-filter="showTimeFilter"
        v-model:date-range="dateRange"
        @date-range-change="handleDateRangeChange"
              @sort-change="handleSortChange"
        @view-detail="handleViewDetail"
      />
    </div>

    <!-- 股票详情对话框组件 -->
    <StockDetail
      v-model="showStockDetail"
      :current-stock="currentStock"
      @close="showStockDetail = false"
    />

    <!-- 个人信息面板 -->
    <el-drawer
      v-model="showProfilePanel"
      title="个人信息"
      direction="rtl"
      size="400px"
      :before-close="handleProfileClose"
    >
      <div class="profile-content">
        <div class="profile-header">
          <el-avatar :size="80" :icon="User" />
          <h3>{{ currentUser }}</h3>
        </div>
        
        <el-divider />
        
        <div class="profile-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">
              {{ currentUser }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userEmail }}
            </el-descriptions-item>
            <el-descriptions-item label="登录时间">
              {{ loginTime }}
            </el-descriptions-item>
            <el-descriptions-item label="用户角色">
              {{ userRoleDescription || userRole }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="profile-actions">
          <el-button type="primary" @click="handleEditProfile">编辑资料</el-button>
          <el-button @click="handleProfileClose">关闭</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 编辑邮箱对话框 -->
    <el-dialog
      v-model="showEmailDialog"
      title="编辑邮箱"
      width="400px"
      :before-close="handleEmailDialogClose"
    >
      <el-form :model="emailForm" label-width="80px">
        <el-form-item label="新邮箱">
          <el-input v-model="emailForm.email" placeholder="请输入新邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleEmailDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSaveEmail">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import FilterPanel from '../components/business/FilterPanel/FilterPanel.vue'
import AppHeader from '../components/common/AppHeader/AppHeader.vue'
import StockTable from '../components/common/StockTable/StockTable.vue'
import StockDetail from '../components/business/StockDetail/StockDetail.vue'
import { User } from '@element-plus/icons-vue'
import { useStockFilter } from '../composables/useStockFilter.js'
import { useStockTable } from '../components/common/StockTable/StockTable.js'

export default {
  name: 'StockFilter',
  components: {
    FilterPanel,
    AppHeader,
    StockTable,
    StockDetail
  },
  setup() {
    const stockFilter = useStockFilter()
    const stockTable = useStockTable()
    
    // 个人信息面板状态
    const showProfilePanel = ref(false)
    const showEmailDialog = ref(false)
    const emailForm = ref({
      email: ''
    })
    
    // 用户信息
    const currentUser = computed(() => localStorage.getItem('username') || '用户')
    const loginTime = computed(() => {
      const time = localStorage.getItem('loginTime')
      return time ? new Date(time).toLocaleString() : new Date().toLocaleString()
    })
    const userRole = computed(() => {
      // 从localStorage获取用户角色信息
      const userRolesJson = localStorage.getItem('userRoles')
      if (userRolesJson) {
        try {
          const roles = JSON.parse(userRolesJson)
          // 如果有多个角色，用逗号连接
          return roles.join(', ')
        } catch (e) {
          console.error('解析用户角色失败:', e)
          return ''
        }
      }
      return ''
    })

    const userRoleDescription = computed(() => {
      try {
        const roleDetails = JSON.parse(localStorage.getItem('userRoleDetails') || '[]')
        return roleDetails.map(role => role.description || role.name).join(', ')
      } catch (e) {
        return ''
      }
    })

    const userEmail = ref(localStorage.getItem('userEmail') || '未设置邮箱')

    // 监听localStorage变化
    const updateEmailDisplay = () => {
      userEmail.value = localStorage.getItem('userEmail') || '未设置邮箱'
    }

    // 监听storage事件
    window.addEventListener('storage', (e) => {
      if (e.key === 'userEmail') {
        updateEmailDisplay()
      }
    })

    // 监听自定义事件
    window.addEventListener('localStorageChanged', (e) => {
      if (e.detail.key === 'userEmail') {
        updateEmailDisplay()
      }
    })

    // 处理筛选条件变化
    const handleFilterChange = (filterData) => {
      // 清除股票详情缓存，确保在筛选条件变化后能获取最新的详情数据
      if (stockTable.tooltipCache && typeof stockTable.tooltipCache.value.clear === 'function') {
        stockTable.tooltipCache.value.clear();
      }
      
      // 调用原始的处理函数
      stockFilter.handleFilterChange(filterData)
    }

    const handleLogout = () => {}
    
    // 显示个人信息面板
    const handleShowProfile = () => {
      showProfilePanel.value = true
    }
    
    // 关闭个人信息面板
    const handleProfileClose = () => {
      showProfilePanel.value = false
    }
    
    // 编辑资料
    const handleEditProfile = () => {
      // 打开邮箱编辑对话框
      emailForm.value.email = userEmail.value === '未设置邮箱' ? '' : userEmail.value
      showEmailDialog.value = true
    }

    // 关闭邮箱编辑对话框
    const handleEmailDialogClose = () => {
      showEmailDialog.value = false
      emailForm.value.email = ''
    }

    // 保存邮箱
    const handleSaveEmail = () => {
      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailForm.value.email)) {
        ElMessage.error('请输入有效的邮箱地址')
        return
      }
      
      // 保存到localStorage
      localStorage.setItem('userEmail', emailForm.value.email)
      // 更新显示
      userEmail.value = emailForm.value.email
      // 触发自定义事件
      window.dispatchEvent(new CustomEvent('localStorageChanged', {
        detail: { key: 'userEmail', value: emailForm.value.email }
      }))
      
      ElMessage.success('邮箱更新成功！')
      handleEmailDialogClose()
    }

    return {
      ...stockFilter,
      handleFilterChange, // 使用自定义的处理函数
      handleLogout,
      handleShowProfile,
      handleProfileClose,
      handleEditProfile,
      handleEmailDialogClose,
      handleSaveEmail,
      showProfilePanel,
      showEmailDialog,
      emailForm,
      currentUser,
      loginTime,
      userRole,
      userRoleDescription,
      userEmail,
      User
    }
  }
}
</script>

<style scoped>
.stock-filter-page {
  width: 70%;
  margin: 0 auto;
  padding: 5px 0;
}

.page-content {
  margin-top: 5px;
}

/* 个人信息面板样式 */
.profile-content {
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 20px;
}

.profile-header h3 {
  margin: 10px 0 0 0;
  color: #303133;
  font-size: 18px;
}

.profile-info {
  margin-bottom: 30px;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stock-filter-page {
    width: 90%;
  }
}

@media (max-width: 768px) {
  .stock-filter-page {
    width: 95%;
  }
}
</style>