// 认证相关工具函数

const TokenKey = 'admin_token'

// 设置token
export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

// 获取token
export function getToken() {
  return localStorage.getItem(TokenKey)
}

// 移除token
export function removeToken() {
  return localStorage.removeItem(TokenKey)
}

// 清除所有认证信息
export function clearAuthInfo() {
  removeToken()
  localStorage.removeItem('userRole')
  localStorage.removeItem('isLoggedIn')
}