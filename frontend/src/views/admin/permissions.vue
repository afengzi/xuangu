<template>
  <div class="permissions-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        type="primary"
        @click="$router.push('/admin/dashboard')"
      >
        返回仪表盘
      </el-button>
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        <span style="margin-left: 8px;">添加权限</span>
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
        <template #default="{ row }">
          <span>{{ row?.id ?? '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限标识" width="200px" align="center">
        <template #default="{ row }">
          <span>{{ getPermissionCode(row?.code ?? row?.name) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限描述" align="center">
        <template #default="{ row }">
          <span>{{ row?.description ?? '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限分组" width="150px" align="center">
        <template #default="{ row }">
          <el-tag>{{ (row?.code || row?.name) ? getPermissionGroup(row.code || row.name) : '' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row?.status)">
            {{ row?.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template #default="{ row }">
          <span>{{ formatTime(row?.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="{ row, $index }">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            v-if="row?.status === 1"
            size="small"
            type="warning"
            @click="handleModifyStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-if="row?.status === 0"
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

    <el-dialog v-model="dialogFormVisible" :title="textMap[dialogStatus]">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="80px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="temp.code" placeholder="例如: user:list" />
        </el-form-item>
        <el-form-item label="显示名称" prop="name">
          <el-input v-model="temp.name" placeholder="例如: 用户列表" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
            placeholder="权限的详细描述"
          />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="temp.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="菜单" value="menu" />
            <el-option label="操作" value="operation" />
          </el-select>
        </el-form-item>
        <el-form-item label="父级ID" prop="parent_id">
          <el-input v-model.number="temp.parent_id" placeholder="默认0(无父级)" />
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
  </div>
</template>

<script>
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/api/admin'
import { parseTime } from '@/utils/formatters/timeFormatters.js'

export default {
  name: 'PermissionManagement',
  // Vue 3 不再推荐使用 filters，改为 methods 中提供
  data() {
    return {
      tableKey: 0,
      list: [], // 初始化为空数组，确保表格能正确渲染
      listLoading: true,
      temp: {
        id: undefined,
        code: '',
        name: '',
        description: '',
        type: 'menu',
        parent_id: 0,
        status: 1
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑权限',
        create: '添加权限'
      },
      rules: {
        code: [
          { required: true, message: '权限编码不能为空', trigger: 'blur' },
          { pattern: /^[a-zA-Z]+:[a-zA-Z_]+$/, message: '格式应为 group:action，字母与下划线', trigger: 'blur' }
        ],
        name: [{ required: true, message: '显示名称不能为空', trigger: 'blur' }],
        description: [{ required: true, message: '权限描述不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getStatusType(status) {
      const statusMap = { 1: 'success', 0: 'danger' }
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
    getPermissionCode(identifier) {
      if (!identifier || typeof identifier !== 'string') return ''
      const parts = identifier.split(':')
      return parts[1] || parts[0] || ''
    },
    async getList() {
      this.listLoading = true
      try {
        console.log('开始获取权限列表...')
        const response = await getPermissions()
        console.log('API Response:', response)
        // 响应拦截器已经提取了data字段，所以直接使用response
        // 统一将 status 转为数字，避免后端返回 '1'/'0' 导致严格等于判断失败
        this.list = (response || []).map(item => ({
          ...item,
          status: Number(item?.status)
        }))
        console.log('权限列表设置完成:', this.list)
      } catch (error) {
        console.error('API Error:', error)
        this.$message.error('获取权限列表失败')
      } finally {
        this.listLoading = false
      }
    },
    getPermissionGroup(permissionName) {
      const parts = permissionName.split(':')
      const groupNames = {
        'user': '用户管理',
        'role': '角色管理',
        'permission': '权限管理',
        'admin': '系统管理'
      }
      return groupNames[parts[0]] || '其他'
    },
    handleModifyStatus(row, status) {
      const oldStatus = row.status
      row.status = status
      // 后端同步更新，失败则回滚
      updatePermission(row.id, { status })
        .then(() => {
          this.$message({ message: '操作成功', type: 'success' })
        })
        .catch(() => {
          row.status = oldStatus
          this.$message.error('更新状态失败')
        })
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        code: '',
        name: '',
        description: '',
        type: 'menu',
        parent_id: 0,
        status: 1
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
          createPermission(this.temp).then((res) => {
            const created = res?.permission || this.temp
            // 确保本地列表结构一致
            created.status = Number(created.status)
            this.list.unshift(created)
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
          updatePermission(tempData.id, tempData).then((res) => {
            const updated = res?.permission || tempData
            updated.status = Number(updated.status)
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, updated)
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
    handleDelete(row, index) {
      this.$confirm('确定删除该权限吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deletePermission(row.id).then(() => {
          this.list.splice(index, 1)
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
        })
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
.permissions-container {
  padding: 20px;
}
</style>