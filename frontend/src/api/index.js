import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, clearAuthInfo } from '@/utils/auth.js'

// 创建axios实例
const service = axios.create({
  // 统一走同源后端 /api，避免生产环境默认指到示例域名
  baseURL: '/api',
  timeout: 15000,
  headers: { 
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加token认证
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const { data, config } = response
    
    // 处理业务状态码
    if (data.code !== undefined) {
      if (data.code === 200) {
        // 如果返回的数据格式包含data字段，直接返回该字段
        // 否则返回整个响应体，以兼容不同的后端响应格式
        return data.data !== undefined ? data.data : data
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 处理没有code字段的响应（如部分后端API）
    return data
  },
  error => {
    // 处理HTTP状态码
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 显示后端返回的具体错误信息，比如"账号已被禁用"、"用户不存在"等
          const unauthorizedMessage = error.response?.data?.error || error.response?.data?.message || '未授权，请重新登录'
          ElMessage.error(unauthorizedMessage)
          // 清除token并跳转到登录页
          clearAuthInfo()
          // 根据当前路径决定跳转到哪个登录页面
          const currentPath = window.location.pathname
          if (currentPath.startsWith('/admin/')) {
            window.location.href = '/admin/login'
          } else {
            window.location.href = '/login'
          }
          break
        case 403:
          // 显示后端返回的具体错误信息，比如"没有权限"
          const forbiddenMessage = error.response?.data?.error || error.response?.data?.message || '权限不足，无法访问'
          ElMessage.error(forbiddenMessage)
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      // 请求配置出错
      ElMessage.error('请求配置错误')
    }
    
    // 记录请求耗时
    if (error.config && error.config.metadata) {
      const duration = Date.now() - error.config.metadata.startTime
      console.warn(`[API Error] ${error.config.method?.toUpperCase()} ${error.config.url} (${duration}ms)`, error)
    }
    
    return Promise.reject(error)
  }
)

/**
 * 通用请求方法
 * @param {string} method 请求方法
 * @param {string} url 请求地址
 * @param {object} data 请求数据或参数
 * @param {object} options 额外配置选项
 * @returns {Promise}
 */
function request(method, url, data = {}, options = {}) {
  const config = { 
    method, 
    url,
    ...options
  }
  
  if (method.toLowerCase() === 'get') {
    config.params = data
  } else {
    config.data = data
  }
  
  return service(config)
}

/**
 * GET请求
 * @param {string} url 请求地址
 * @param {object} params 查询参数
 * @param {object} options 额外配置
 */
export const get = (url, params = {}, options = {}) => 
  request('get', url, params, options)

/**
 * POST请求
 * @param {string} url 请求地址
 * @param {object} data 请求数据
 * @param {object} options 额外配置
 */
export const post = (url, data = {}, options = {}) => 
  request('post', url, data, options)

/**
 * PUT请求
 * @param {string} url 请求地址
 * @param {object} data 请求数据
 * @param {object} options 额外配置
 */
export const put = (url, data = {}, options = {}) => 
  request('put', url, data, options)

/**
 * DELETE请求
 * @param {string} url 请求地址
 * @param {object} params 查询参数
 * @param {object} options 额外配置
 */
export const del = (url, params = {}, options = {}) => 
  request('delete', url, params, options)

/**
 * 上传文件
 * @param {string} url 上传地址
 * @param {FormData} formData 表单数据
 * @param {object} options 额外配置
 */
export const upload = (url, formData, options = {}) => {
  return service({
    method: 'post',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    ...options
  })
}

/**
 * 下载文件
 * @param {string} url 下载地址
 * @param {object} params 查询参数
 * @param {string} filename 文件名
 */
export const download = (url, params = {}, filename = '') => {
  return service({
    method: 'get',
    url,
    params,
    responseType: 'blob'
  }).then(response => {
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    link.click()
    window.URL.revokeObjectURL(downloadUrl)
  })
}

export default service