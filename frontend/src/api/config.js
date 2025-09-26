/**
 * API配置文件
 * 集中管理所有API接口的配置信息
 */

// API基础配置
export const API_CONFIG = {
  // 开发环境配置
  development: {
    baseURL: '/api',
    timeout: 15000,
    mockEnabled: true
  },
  
  // 生产环境配置
  production: {
    baseURL: 'https://api.yourdomain.com',
    timeout: 30000,
    mockEnabled: false
  },
  
  // 测试环境配置
  test: {
    baseURL: 'https://test-api.yourdomain.com',
    timeout: 20000,
    mockEnabled: false
  }
}

// API接口版本
export const API_VERSION = 'v1'

// 请求重试配置
export const RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 只在网络错误或5xx错误时重试
    return !error.response || (error.response.status >= 500 && error.response.status < 600)
  }
}

// 缓存配置
export const CACHE_CONFIG = {
  // 缓存时间（毫秒）
  defaultTTL: 5 * 60 * 1000, // 5分钟
  
  // 需要缓存的接口
  cacheableEndpoints: [
    '/stock/filter/categories',
    '/stock/filter/conditions',
    '/stock/detail'
  ],
  
  // 缓存键生成规则
  generateCacheKey: (url, params) => {
    const sortedParams = Object.keys(params || {})
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return `${url}?${sortedParams}`
  }
}

// 错误码映射
export const ERROR_CODES = {
  // 业务错误码
  BUSINESS_ERROR: {
    1001: '参数验证失败',
    1002: '用户未登录',
    1003: '权限不足',
    1004: '资源不存在',
    1005: '操作失败'
  },
  
  // HTTP错误码
  HTTP_ERROR: {
    400: '请求参数错误',
    401: '未授权访问',
    403: '禁止访问',
    404: '资源不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  }
}

// 请求头配置
export const HEADERS = {
  // 默认请求头
  default: {
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json'
  },
  
  // 文件上传请求头
  upload: {
    'Content-Type': 'multipart/form-data'
  },
  
  // 文件下载请求头
  download: {
    'Accept': 'application/octet-stream'
  }
}

// 接口权限配置
export const API_PERMISSIONS = {
  // 需要登录的接口
  requireAuth: [
    '/stock/filter/save',
    '/stock/filter/delete',
    '/portfolio/create',
    '/portfolio/update',
    '/portfolio/delete'
  ],
  
  // 需要特定权限的接口
  requirePermission: {
    '/admin/users': ['admin'],
    '/admin/settings': ['admin', 'manager']
  }
}


