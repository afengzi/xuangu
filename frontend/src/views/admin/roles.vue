<template>
  <div class="roles-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
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
    >
      <el-table-column label="ID" prop="id" align="center" width="80">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色名称" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色描述" align="center">
        <template slot-scope="{row}">
          <span>{{ row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限数量" width="100px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.permissions ? row.permissions.length : 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.created_at | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            type="warning"
            size="mini"
            @click="handlePermissions(row)"
          >
            权限
          </el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(row,$index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
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
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
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
    </el-dialog>

    <el-dialog title="分配权限" :visible.sync="permissionDialogVisible">
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
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="permissionDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="assignPermissions">
          确认
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRoles, createRole, updateRole, deleteRole, assignRolePermissions } from '@/api/admin'
import { getPermissions } from '@/api/admin'
import { parseTime } from '@/utils/formatters/timeFormatters.js'

export default {
  name: 'RoleManagement',
  filters: {
    statusFilter(status) {
      const statusMap = {
        1: 'success',
        0: 'danger'
      }
      return statusMap[status]
    },
    parseTime
  },
  data() {
    return {
      tableKey: 0,
      list: null,
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
    async getList() {
      this.listLoading = true
      try {
        const response = await getRoles()
        this.list = response.data
      } catch (error) {
        this.$message.error('获取角色列表失败')
      } finally {
        this.listLoading = false
      }
    },
    async getPermissions() {
      try {
        const response = await getPermissions()
        this.permissionList = response.data
        // 构建权限树结构
        this.buildPermissionTree()
      } catch (error) {
        this.$message.error('获取权限列表失败')
      }
    },
    buildPermissionTree() {
      // 简单的权限树构建，按权限名称分组
      const groups = {}
      this.permissionList.forEach(permission => {
        const groupName = permission.name.split(':')[0] || '其他'
        if (!groups[groupName]) {
          groups[groupName] = {
            id: `group_${groupName}`,
            name: this.getPermissionGroupName(groupName),
            children: []
          }
        }
        groups[groupName].children.push({
          id: permission.id,
          name: permission.description || permission.name
        })
      })
      
      this.permissionTreeData = Object.values(groups)
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
      this.temp = Object.assign({}, row)
      this.temp.permission_ids = row.permissions ? row.permissions.map(p => p.id) : []
      this.permissionDialogVisible = true
    },
    async assignPermissions() {
      const checkedKeys = this.$refs.permissionTree.getCheckedKeys()
      // 过滤掉分组节点
      const permissionIds = checkedKeys.filter(id => !id.startsWith('group_'))
      
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
        this.$message.error('权限分配失败')
      }
    },
    handleDelete(row, index) {
      this.$confirm('确定删除该角色吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteRole(row.id).then(() => {
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
.roles-container {
  padding: 20px;
}
</style>