import axios from 'axios'
import { ElMessage } from 'element-plus'

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
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }
    
    console.log('发送请求：', config.method?.toUpperCase(), config.url, config.data || config.params)
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const { data, config } = response
    const endTime = new Date()
    const duration = endTime - config.metadata?.startTime
    
    console.log(`请求完成：${config.url} (${duration}ms)`)
    
    // 处理业务状态码
    if (data.code && data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    
    return data
  },
  error => {
    console.error('响应错误：', error)
    
    // 处理HTTP状态码
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 清除token并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('禁止访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error('请求配置错误')
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