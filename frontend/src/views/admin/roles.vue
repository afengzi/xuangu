<template>
  <div class="roles-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        type="primary"
        @click="goToDashboard"
        :icon="House"
      >
        返回仪表盘
      </el-button>
      <el-button
        class="filter-item"
        type="primary"
        @click="handleCreate"
        :icon="Edit"
      >
        添加角色
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
      @sort-change="sortChange"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '500' }"
      :row-style="{ cursor: 'pointer' }"
    >
      <el-table-column label="ID" align="center" width="80">
        <template #default="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色名称" width="150px" align="center">
        <template #default="{row}">
          <div class="role-name-container">
            <span class="role-name">{{ row?.name ?? '未知角色' }}</span>
            <el-tag v-if="row.isDefault" type="warning" size="small" style="margin-left: 8px;">默认</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="角色描述" align="center">
        <template #default="{row}">
          <span>{{ row?.description ?? '暂无描述' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限数量" width="100px" align="center">
        <template #default="{row}">
          <el-tag type="info" size="small">
            {{ row?.permission_count ?? 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <el-tag 
            :type="getStatusType(row?.status ?? 0)" 
            size="small"
            effect="light">
            {{ (row?.status ?? 0) == 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160px" align="center">
        <template #default="{row}">
          <span style="font-size: 12px; color: #909399;">
            {{ formatTime(row?.created_at) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
        <template #default="{row,$index}">
          <el-button 
            type="primary" 
            size="small" 
            @click="handleUpdate(row)"
            :icon="Edit">
            编辑
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="handlePermissions(row)"
            :icon="Key">
            权限
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row,$index)"
            :icon="Delete">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="80px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="temp.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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

    <el-dialog title="分配权限" v-model="permissionDialogVisible">
      <el-form label-position="left" label-width="80px">
        <el-form-item label="角色名称">
          <span>{{ temp.name }}</span>
        </el-form-item>
        <el-form-item label="权限分配">
          <el-tree
            ref="permissionTree"
            :data="permissionTreeData"
            show-checkbox
            node-key="id"
            :default-checked-keys="temp.permission_ids"
            :props="defaultProps"
            class="permission-tree"
            default-expand-all
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="assignPermissions">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getRoles, createRole, updateRole, deleteRole, assignRolePermissions } from '@/api/admin'
import { getPermissions } from '@/api/admin'
import { parseTime } from '@/utils/formatters/timeFormatters.js'
import { Edit, Key, Delete, House } from '@element-plus/icons-vue'

export default {
  name: 'RoleManagement',
  components: {
    Edit,
    Key,
    Delete,
    House
  },
  data() {
    return {
      tableKey: 0,
      list: [], // 初始化为空数组，确保表格能正确渲染
      listLoading: true,
      permissionList: [],
      temp: {
        id: undefined,
        name: '',
        description: '',
        status: 1,
        permission_ids: []
      },
      dialogFormVisible: false,
      permissionDialogVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑角色',
        create: '添加角色'
      },
      rules: {
        name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
        description: [{ required: true, message: '角色描述不能为空', trigger: 'blur' }]
      },
      permissionTreeData: [],
      defaultProps: {
        children: 'children',
        label: 'name'
      }
    }
  },
  created() {
    this.getList()
    this.getPermissions()
  },
  methods: {
    goToDashboard() {
      this.$router.push('/admin/dashboard')
    },
    getStatusType(status) {
      const statusMap = {
        1: 'success',
        0: 'info'
      }
      return statusMap[status]
    },
    formatTime(time) {
      if (!time) return '-'
      try {
        return parseTime(time, '{y}-{m}-{d} {h}:{i}')
      } catch (error) {
        console.warn('时间格式化失败:', time, error)
        return '-'
      }
    },
    parseTime,
    sortChange(data) {
      // 排序变更处理
      console.log('表格排序变更:', data)
      // 这里可以实现排序逻辑，如果需要的话
    },
    async getList() {
      this.listLoading = true
      try {
        console.log('开始获取角色列表...')
        const response = await getRoles()
        console.log('角色API Response:', response)
        
        // 处理多种可能的响应格式
        let roles = []
        
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            // 格式: 直接数组
            roles = response
          } else if (response.data !== undefined) {
            // 格式: {data: []}
            roles = response.data
          } else if (response.items !== undefined) {
            // 格式: {items: []}
            roles = response.items
          } else if (response.list !== undefined) {
            // 格式: {list: []}
            roles = response.list
          } else {
            // 其他对象格式，尝试提取数据
            roles = Object.values(response).filter(item => item && typeof item === 'object')
          }
        } else if (Array.isArray(response)) {
          // 直接是数组的情况
          roles = response
        }
        
        // 数据验证和过滤
        if (!Array.isArray(roles)) {
          console.warn('角色数据不是数组，转换为数组:', roles)
          roles = roles ? [roles] : []
        }
        
        // 过滤空数据并统一状态字段为数字类型
        roles = roles.filter(role => role && role.id).map(role => ({
          ...role,
          status: Number(role?.status)
        }))
        
        this.list = roles
        console.log('处理后的角色数据:', roles)
        
        // 空数据处理
        if (roles.length === 0) {
          console.log('角色列表为空')
          this.$message.info('暂无角色数据')
        }
        
      } catch (error) {
        console.error('获取角色列表失败:', error)
        this.$message.error('获取角色列表失败: ' + (error.message || '未知错误'))
        this.list = []
      } finally {
        this.listLoading = false
      }
    },
    async getPermissions() {
      try {
        console.log('开始获取权限列表...')
        const response = await getPermissions()
        console.log('权限API Response:', response)
        
        // 处理多种可能的响应格式
        let permissions = []
        if (response && typeof response === 'object') {
          if (Array.isArray(response)) {
            permissions = response
          } else if (response.data && Array.isArray(response.data)) {
            permissions = response.data
          } else if (response.items && Array.isArray(response.items)) {
            permissions = response.items
          } else if (response.list && Array.isArray(response.list)) {
            permissions = response.list
          }
        }
        
        this.permissionList = permissions
        console.log('处理后的权限数据:', permissions)
        
        if (permissions.length > 0) {
          // 构建权限树结构
          this.buildPermissionTree()
        } else {
          console.warn('权限列表为空')
          this.$message.info('暂无权限数据')
        }
        
      } catch (error) {
        console.error('获取权限列表失败:', error)
        this.$message.error('获取权限列表失败: ' + (error.message || '未知错误'))
        this.permissionList = []
        this.permissionTreeData = []
      }
    },
    buildPermissionTree() {
      // 权限树构建，按权限分组并去重
      const groups = {}
      
      if (!this.permissionList || !Array.isArray(this.permissionList)) {
        console.warn('权限列表数据无效:', this.permissionList)
        this.permissionTreeData = []
        return
      }
      
      // 使用Map来去重，确保相同名称的权限只显示一次
      const permissionMap = new Map()
      
      this.permissionList.forEach(permission => {
        if (!permission || !permission.id) {
          console.warn('权限数据不完整:', permission)
          return
        }
        
        // 使用权限编码来去重，如果没有编码则使用名称
        const permissionKey = permission.code || permission.name || permission.id
        
        // 如果该权限编码已经存在，则跳过（保留第一个）
        if (permissionMap.has(permissionKey)) {
          return
        }
        
        permissionMap.set(permissionKey, permission)
      })
      
      // 构建分组树结构
      permissionMap.forEach(permission => {
        const groupName = permission.code ? permission.code.split(':')[0] : 
                         permission.name ? permission.name.split(':')[0] : '其他'
        
        if (!groups[groupName]) {
          groups[groupName] = {
            id: `group_${groupName}`,
            name: this.getPermissionGroupName(groupName),
            children: []
          }
        }
        
        // 显示优先级：name > code > ID
        const displayName = permission.name || permission.code || `权限_${permission.id}`
        
        groups[groupName].children.push({
          id: permission.id,
          name: displayName
        })
      })
      
      this.permissionTreeData = Object.values(groups)
      console.log('构建的权限树结构（已去重）:', this.permissionTreeData)
    },
    getPermissionGroupName(group) {
      const groupNames = {
        'user': '用户管理',
        'role': '角色管理',
        'permission': '权限管理',
        'admin': '系统管理'
      }
      return groupNames[group] || group
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        description: '',
        status: 1,
        permission_ids: []
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
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          createRole(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          updateRole(tempData.id, tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handlePermissions(row) {
      console.log('开始分配权限，角色数据:', row)
      this.temp = Object.assign({}, row)
      this.temp.permission_ids = row.permissions ? row.permissions.map(p => p.id) : []
      console.log('当前角色已有权限ID:', this.temp.permission_ids)
      this.permissionDialogVisible = true
      
      // 确保权限树已加载
      if (this.permissionTreeData.length === 0) {
        this.$message.warning('权限数据未加载，请刷新页面重试')
      }
    },
    async assignPermissions() {
      try {
        const checkedKeys = this.$refs.permissionTree.getCheckedKeys()
        console.log('选中的权限节点:', checkedKeys)
        
        // 过滤掉分组节点
        const permissionIds = checkedKeys.filter(id => !id.startsWith('group_'))
        console.log('实际分配的权限ID:', permissionIds)
        
        if (permissionIds.length === 0) {
          this.$confirm('确定要清空该角色的所有权限吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(async () => {
            await this.doAssignPermissions(permissionIds)
          }).catch(() => {
            // 用户取消操作
          })
        } else {
          await this.doAssignPermissions(permissionIds)
        }
      } catch (error) {
        console.error('权限分配失败:', error)
        this.$message.error('权限分配失败: ' + (error.message || '未知错误'))
      }
    },
    
    async doAssignPermissions(permissionIds) {
      try {
        await assignRolePermissions(this.temp.id, { permission_ids: permissionIds })
        this.permissionDialogVisible = false
        this.$notify({
          title: '成功',
          message: '权限分配成功',
          type: 'success',
          duration: 2000
        })
        this.getList()
      } catch (error) {
        console.error('权限分配失败:', error)
        this.$message.error('权限分配失败: ' + (error.message || '未知错误'))
      }
    },
    handleDelete(row, index) {
      this.$confirm(`确定删除角色「${row.name}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteRole(row.id)
          this.list.splice(index, 1)
          this.$notify({
            title: '成功',
            message: `角色「${row.name}」删除成功`,
            type: 'success',
            duration: 2000
          })
        } catch (error) {
          console.error('删除角色失败:', error)
          this.$message.error('删除角色失败: ' + (error.message || '未知错误'))
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
.roles-container {
  padding: 20px;
}

.role-name {
    font-weight: 500;
    color: #303133;
  }
  
  .role-name-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

.role-name:hover {
  color: #409EFF;
  cursor: pointer;
}

.el-table {
  .el-button {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  
  .el-button:last-child {
    margin-right: 0;
  }
}

.permission-tree {
  .el-tree-node__content {
    height: 36px;
  }
  
  .el-checkbox__input {
    margin-right: 8px;
  }
}

.dialog-footer {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}
</style>