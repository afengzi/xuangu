<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>管理后台仪表盘</h1>
      <p>欢迎回来，{{ userInfo.username }}</p>
    </div>
    
    <el-row :gutter="20" class="dashboard-stats">
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-number">{{ stats.userCount }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-number">{{ stats.roleCount }}</div>
            <div class="stat-label">角色总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-number">{{ stats.permissionCount }}</div>
            <div class="stat-label">权限总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-item">
            <div class="stat-number">{{ stats.onlineCount }}</div>
            <div class="stat-label">在线用户</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-info">
      <el-col :span="12">
        <el-card title="我的信息">
          <div class="user-info">
            <p><strong>用户名：</strong>{{ userInfo.username }}</p>
            <p><strong>角色：</strong>{{ userRoles.join(', ') }}</p>
            <p><strong>登录时间：</strong>{{ loginTime }}</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="快速操作">
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/users')">
              用户管理
            </el-button>
            <el-button type="success" @click="$router.push('/admin/roles')">
              角色管理
            </el-button>
            <el-button type="warning" @click="$router.push('/admin/permissions')">
              权限管理
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getUsers, getRoles, getPermissions, getProfile } from '@/api/admin'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      stats: {
        userCount: 0,
        roleCount: 0,
        permissionCount: 0,
        onlineCount: 0
      },
      loginTime: new Date().toLocaleString(),
      userInfo: {
        username: ''
      },
      userRoles: []
    }
  },
  created() {
    this.loadStats()
    this.loadUserInfo()
  },
  methods: {
    async loadStats() {
      try {
        // 获取用户统计
        const usersRes = await getUsers({ page: 1, limit: 1 })
        // 注意：response interceptor已经提取了data字段，直接使用即可
        this.stats.userCount = usersRes.total || 0

        // 获取角色统计
        const rolesRes = await getRoles()
        // 直接使用返回的数据数组
        this.stats.roleCount = rolesRes.length || 0

        // 获取权限统计
        const permissionsRes = await getPermissions()
        // 直接使用返回的数据数组
        this.stats.permissionCount = permissionsRes.length || 0

        // TODO: 获取在线用户数（需要后端支持）
        this.stats.onlineCount = 0
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.$message.error('加载统计数据失败')
      }
    },
    async loadUserInfo() {
      try {
        // 直接从API获取用户信息
        const res = await getProfile()
        // 注意：response interceptor已经提取了data字段，直接使用即可
        this.userInfo = res || { username: '管理员' }
        this.userRoles = res.roles || ['管理员']
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.$message.error('加载用户信息失败')
        // 提供默认值
        this.userInfo = { username: '管理员' }
        this.userRoles = ['管理员']
      }
    }
  }
}
</script>

<style lang="css" scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-container .dashboard-header {
  margin-bottom: 30px;
}

.dashboard-container .dashboard-header h1 {
  margin: 0 0 10px 0;
  color: #303133;
}

.dashboard-container .dashboard-header p {
  color: #909399;
  margin: 0;
}

.dashboard-container .dashboard-stats {
  margin-bottom: 20px;
}

.dashboard-container .dashboard-stats .stat-item {
  text-align: center;
  padding: 20px;
}

.dashboard-container .dashboard-stats .stat-item .stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.dashboard-container .dashboard-stats .stat-item .stat-label {
  color: #909399;
  font-size: 14px;
}

.dashboard-container .dashboard-info .user-info p {
  margin: 10px 0;
  color: #606266;
}

.dashboard-container .dashboard-info .user-info p strong {
  color: #303133;
}

.dashboard-container .dashboard-info .quick-actions {
  text-align: center;
}

.dashboard-container .dashboard-info .quick-actions .el-button {
  margin: 10px;
}
</style>