import service from './index.js'

// 管理员登录
export function adminLogin(data) {
  return service({
    url: '/admin/login',
    method: 'post',
    data
  })
}

// 管理员退出登录
export function adminLogout() {
  return service({
    url: '/admin/logout',
    method: 'post'
  })
}

// 获取当前用户信息
export function getProfile() {
  return service({
    url: '/admin/profile',
    method: 'get'
  })
}

// 用户管理API
export function getUsers(params) {
  return service({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export function createUser(data) {
  return service({
    url: '/admin/users',
    method: 'post',
    data
  })
}

export function getUser(userId) {
  return service({
    url: `/admin/users/${userId}`,
    method: 'get'
  })
}

export function updateUser(userId, data) {
  return service({
    url: `/admin/users/${userId}`,
    method: 'put',
    data
  })
}

export function deleteUser(userId) {
  return service({
    url: `/admin/users/${userId}`,
    method: 'delete'
  })
}

export function assignUserRoles(userId, data) {
  return service({
    url: `/admin/users/${userId}/roles`,
    method: 'put',
    data
  })
}

// 角色管理API
export function getRoles() {
  return service({
    url: '/admin/roles',
    method: 'get'
  })
}

export function createRole(data) {
  return service({
    url: '/admin/roles',
    method: 'post',
    data
  })
}

export function getRole(roleId) {
  return service({
    url: `/admin/roles/${roleId}`,
    method: 'get'
  })
}

export function updateRole(roleId, data) {
  return service({
    url: `/admin/roles/${roleId}`,
    method: 'put',
    data
  })
}

export function deleteRole(roleId) {
  return service({
    url: `/admin/roles/${roleId}`,
    method: 'delete'
  })
}

export function assignRolePermissions(roleId, data) {
  return service({
    url: `/admin/roles/${roleId}/permissions`,
    method: 'put',
    data
  })
}

// 权限管理API
export function getPermissions() {
  return service({
    url: '/admin/permissions',
    method: 'get'
  })
}

export function createPermission(data) {
  return service({
    url: '/admin/permissions',
    method: 'post',
    data
  })
}

export function getPermission(permissionId) {
  return service({
    url: `/admin/permissions/${permissionId}`,
    method: 'get'
  })
}

export function updatePermission(permissionId, data) {
  return service({
    url: `/admin/permissions/${permissionId}`,
    method: 'put',
    data
  })
}

export function deletePermission(permissionId) {
  return service({
    url: `/admin/permissions/${permissionId}`,
    method: 'delete'
  })
}