<template>
  <div class="users-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        type="primary"
        @click="$router.push('/admin/dashboard')"
      >
        返回Dashboard
      </el-button>
      
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        <span style="margin-left: 8px;">添加用户</span>
      </el-button>
      
      <div style="flex: 1;"></div>
      
      <el-input
        v-model="listQuery.username"
        placeholder="用户名"
        style="width: 200px; margin-right: 10px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />
      
      <el-select
        v-model="listQuery.role"
        placeholder="角色"
        clearable
        style="width: 130px; margin-right: 10px;"
        class="filter-item"
      >
        <el-option
          v-for="item in roleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        搜索
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column label="ID" align="center" width="80">
        <template #default="{row}">
          <span>{{ row?.id ?? '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户名" width="150px" align="center">
        <template #default="{row}">
          <span>{{ row?.username ?? '未知用户' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="200px" align="center">
        <template #default="{row}">
          <template v-if="row?.roles && row.roles.length > 0">
            <el-tag
              v-for="role in row.roles"
              :key="role?.id"
              type="info"
              style="margin-right: 5px;"
            >
              {{ role?.name ?? '未知角色' }}
            </el-tag>
          </template>
          <template v-else>
            <span style="color: #909399; font-size: 12px;">无角色</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <el-tag :type="row?.status == 1 ? 'success' : 'danger'">
            {{ row?.status == 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template #default="{row}">
          <span>{{ formatTime(row?.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后登录时间" width="150px" align="center">
        <template #default="{row}">
          <span>{{ formatTime(row?.last_login) || '从未登录' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="{row,$index}">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            v-if="row?.status == 1"
            size="small"
            type="warning"
            @click="handleModifyStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-if="row?.status == 0"
            size="small"
            type="success"
            @click="handleModifyStatus(row, 1)"
          >
            启用
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row,$index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="total>0"
      :total="total"
      :current-page="listQuery.page"
      :page-size="listQuery.limit"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
    />

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="70px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="temp.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="temp.password"
            type="password"
            placeholder="留空则不修改密码"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="temp.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="temp.role_ids" multiple placeholder="请选择角色">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="dialogStatus==='create'?createData():updateData()"
        >
          确认
        </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getUsers, createUser, getUser, updateUser, deleteUser } from '@/api/admin.js'
import { getRoles } from '@/api/admin.js'
import waves from '@/directive/waves'
import { parseTime } from '@/utils/formatters/timeFormatters.js'

export default {
  name: 'UserManagement',
  directives: { waves },
  data() {
    return {
      tableKey: 0,
      list: [], // 初始化为空数组，确保表格能正确渲染
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        username: undefined,
        role: undefined
      },
      roleOptions: [],
      temp: {
        id: undefined,
        username: '',
        password: '',
        status: 1,
        role_ids: []
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑用户',
        create: '添加用户'
      },
      rules: {
        username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    this.getRoles()
  },
  methods: {
    formatTime(time) {
      if (!time) return '-'
      try {
        return parseTime(time, '{y}-{m}-{d} {h}:{i}')
      } catch (error) {
        console.warn('时间格式化失败:', time, error)
        return '-'
      }
    },
    async getList() {
      this.listLoading = true
      try {
        console.log('开始获取用户列表...')
        const response = await getUsers(this.listQuery)
        console.log('用户API Response:', response)
        
        // 处理多种可能的响应格式
        let users = []
        let total = 0
        
        if (response && typeof response === 'object') {
          if (response.items !== undefined) {
            // 格式: {items: [], total: number}
            users = response.items
            total = response.total
          } else if (response.users !== undefined) {
            // 格式: {users: [], total: number}
            users = response.users
            total = response.total
          } else if (Array.isArray(response)) {
            // 格式: 直接数组
            users = response
            total = response.length
          } else {
            // 其他对象格式，尝试提取数据
            users = response.data || response.list || []
            total = response.total || users.length
          }
        } else if (Array.isArray(response)) {
          // 直接是数组的情况
          users = response
          total = response.length
        }
        
        // 数据验证和过滤
        if (!Array.isArray(users)) {
          console.warn('用户数据不是数组，转换为数组:', users)
          users = users ? [users] : []
        }
        
        // 过滤空数据
        users = users.filter(user => user && user.id)
        console.log('过滤后的用户数据:', users)
        
        this.list = users
        this.total = total || users.length
        
        // 空数据处理
        if (users.length === 0) {
          console.log('用户列表为空')
          this.$message.info('暂无用户数据')
        }
        
      } catch (error) {
        console.error('获取用户列表失败:', error)
        this.$message.error('获取用户列表失败: ' + (error.message || '未知错误'))
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },
    async getRoles() {
      try {
        const response = await getRoles()
        console.log('角色API Response:', response)
        
        // 处理多种可能的响应格式
        let roles = []
        
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            roles = response
          } else if (response.items !== undefined) {
            roles = response.items
          } else if (response.data !== undefined) {
            roles = response.data
          } else if (response.list !== undefined) {
            roles = response.list
          } else {
            // 其他对象格式，尝试提取数据
            roles = Object.values(response).filter(item => item && typeof item === 'object')
          }
        } else if (Array.isArray(response)) {
          roles = response
        }
        
        // 数据验证和过滤
        if (!Array.isArray(roles)) {
          console.warn('角色数据不是数组，转换为数组:', roles)
          roles = roles ? [roles] : []
        }
        
        // 过滤空数据并转换为el-option需要的格式
        roles = roles.filter(role => role && role.id).map(role => ({
          value: role.id,
          label: role.name || role.role_name || '未知角色'
        }))
        
        this.roleOptions = roles
        console.log('处理后的角色数据:', roles)
        
        // 空数据处理
        if (roles.length === 0) {
          console.log('角色列表为空')
        }
        
      } catch (error) {
        console.error('获取角色列表失败:', error)
        this.$message.error('获取角色列表失败: ' + (error.message || '未知错误'))
        this.roleOptions = []
      }
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    
    // 处理分页大小变化
    handleSizeChange(val) {
      this.listQuery.limit = val
      this.getList()
    },
    
    // 处理当前页码变化
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    async handleModifyStatus(row, status) {
      try {
        // 保存原始状态，用于错误时恢复
        const originalStatus = row.status
        
        // 更新本地状态以提供即时反馈
        row.status = status
        
        // 发送状态更新请求到后端，使用现有的updateUser接口
        await updateUser(row.id, { status })
        
        // 显示成功消息
        this.$message({
          message: '状态更新成功',
          type: 'success'
        })
        
        // 刷新列表以确保数据一致性
        this.getList()
      } catch (error) {
        console.error('更新用户状态失败:', error)
        this.$message.error('更新用户状态失败: ' + (error.message || '未知错误'))
        // 恢复原始状态
        row.status = row.status === 1 ? 0 : 1
      }
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        username: '',
        password: '',
        status: 1,
        role_ids: []
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    async createData() {
      this.$refs['dataForm'].validate(async (valid) => {
        if (valid) {
          try {
            // 复制temp对象以避免直接修改
            const userData = { ...this.temp }
            // 创建用户
            const response = await createUser(userData)
            
            // 关闭对话框
            this.dialogFormVisible = false
            
            // 如果后端返回了创建的用户完整信息，则使用该信息
            const newUser = response || userData
            
            // 添加到列表开头
            this.list.unshift(newUser)
            this.total++
            
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
            
            // 刷新列表以确保数据一致性
            this.getList()
          } catch (error) {
            console.error('创建用户失败:', error)
            this.$message.error('创建用户失败: ' + (error.message || '未知错误'))
          }
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row)
      this.temp.password = ''
      this.temp.role_ids = row.roles ? row.roles.map(role => role.id) : []
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    async updateData() {
      this.$refs['dataForm'].validate(async (valid) => {
        if (valid) {
          try {
            // 复制temp对象并确保有id
            const userData = { ...this.temp }
            if (!userData.id) {
              throw new Error('用户ID不能为空')
            }
            
            // 更新用户
            const response = await updateUser(userData.id, userData)
            
            // 关闭对话框
            this.dialogFormVisible = false
            
            // 更新列表中的用户数据
            const index = this.list.findIndex(v => v.id === userData.id)
            if (index !== -1) {
              // 使用后端返回的数据更新列表项
              this.list.splice(index, 1, response || userData)
            }
            
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
            
            // 刷新列表以确保数据一致性
            this.getList()
          } catch (error) {
            console.error('更新用户失败:', error)
            this.$message.error('更新用户失败: ' + (error.message || '未知错误'))
          }
        }
      })
    },
    handleDelete(row, index) {
      this.$confirm('确定删除该用户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 调用删除API
          await deleteUser(row.id)
          
          // 从列表中移除
          this.list.splice(index, 1)
          this.total--
          
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
          
          // 刷新列表以确保数据一致性
          this.getList()
        } catch (error) {
          console.error('删除用户失败:', error)
          this.$message.error('删除用户失败: ' + (error.message || '未知错误'))
          // 如果列表为空，刷新列表
          if (this.list.length === 0) {
            this.getList()
          }
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    }
  }
}
</script>

<style scoped>
.filter-container {
  padding-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-bottom: 10px;
}

.users-container {
  padding: 20px;
}
</style>