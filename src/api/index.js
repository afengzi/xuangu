import axios from 'axios'
import { ElMessage } from 'element-plus'
import { setupMockInterceptor } from '../mock/stockData.js'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : 'https://api.example.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

// 在开发环境下启用Mock数据拦截器
if (process.env.NODE_ENV === 'development') {
  setupMockInterceptor(service)
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    console.log('发送请求：', config.url)
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
    const { data } = response
    if (data.code && data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  error => {
    console.error('响应错误：', error)
    ElMessage.error('网络请求失败')
    return Promise.reject(error)
  }
)

/**
 * 通用请求方法
 * @param {string} method 请求方法
 * @param {string} url 请求地址
 * @param {object} data 请求数据或参数
 * @returns {Promise}
 */
function request(method, url, data = {}) {
  const config = { method, url }
  if (method === 'get') {
    config.params = data
  } else {
    config.data = data
  }
  return service(config)
}

/**
 * GET请求
 */
export const get = (url, params) => request('get', url, params)

/**
 * POST请求
 */
export const post = (url, data) => request('post', url, data)

export default service 