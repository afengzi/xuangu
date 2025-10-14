<template>
  <div class="permissions-container">
    <div class="filter-container">
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        添加权限
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
      <el-table-column label="权限标识" width="200px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限描述" align="center">
        <template slot-scope="{row}">
          <span>{{ row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="权限分组" width="150px" align="center">
        <template slot-scope="{row}">
          <el-tag>{{ getPermissionGroup(row.name) }}</el-tag>
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
            v-if="row.status === 1"
            size="mini"
            type="warning"
            @click="handleModifyStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-if="row.status === 0"
            size="mini"
            type="success"
            @click="handleModifyStatus(row, 1)"
          >
            启用
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
        <el-form-item label="权限标识" prop="name">
          <el-input v-model="temp.name" placeholder="例如: user:create" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
            placeholder="权限的详细描述"
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
  </div>
</template>

<script>
import { getPermissions, createPermission, updatePermission, deletePermission } from '@/api/admin'
import { parseTime } from '@/utils/formatters/timeFormatters.js'

export default {
  name: 'PermissionManagement',
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
      temp: {
        id: undefined,
        name: '',
        description: '',
        status: 1
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑权限',
        create: '添加权限'
      },
      rules: {
        name: [
          { required: true, message: '权限标识不能为空', trigger: 'blur' },
          { pattern: /^[a-zA-Z_:]+$/, message: '权限标识只能包含字母、下划线和冒号', trigger: 'blur' }
        ],
        description: [{ required: true, message: '权限描述不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    async getList() {
      this.listLoading = true
      try {
        const response = await getPermissions()
        this.list = response.data
      } catch (error) {
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
      this.$message({
        message: '操作成功',
        type: 'success'
      })
      row.status = status
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        description: '',
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
          createPermission(this.temp).then(() => {
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
          updatePermission(tempData.id, tempData).then(() => {
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