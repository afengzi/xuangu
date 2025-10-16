import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_CONFIG, RETRY_CONFIG, CACHE_CONFIG, ERROR_CODES, HEADERS, API_PERMISSIONS } from './config.js'

/**
 * API服务类
 * 提供统一的HTTP请求服务，包含错误处理、重试机制、缓存等功能
 */
class ApiService {
  constructor() {
    this.service = null
    this.cache = new Map()
    this.retryCount = new Map()
    this.init()
  }

  /**
   * 初始化服务
   */
  init() {
    const env = process.env.NODE_ENV || 'development'
    const config = API_CONFIG[env]
    
    this.service = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: HEADERS.default
    })
    
    this.setupInterceptors()
    
    // 开发环境启用Mock
    if (config.mockEnabled) {
      this.enableMock()
    }
  }

  /**
   * 设置拦截器
   */
  setupInterceptors() {
    // 请求拦截器
    this.service.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    )
    
    // 响应拦截器
    this.service.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    )
  }

  /**
   * 请求拦截器处理
   */
  handleRequest(config) {
    // 添加认证token
    const token = this.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }
    
    // 检查接口权限
    if (this.requireAuth(config.url) && !token) {
      this.redirectToLogin()
      return Promise.reject(new Error('未登录'))
    }
    
    // 检查缓存
    if (this.isCacheable(config.url) && config.method === 'get') {
      const cached = this.getCache(config.url, config.params)
      if (cached) {
        return Promise.resolve(cached)
      }
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params)
    return config
  }

  /**
   * 请求错误处理
   */
  handleRequestError(error) {
    console.error('[API] 请求错误:', error)
    return Promise.reject(error)
  }

  /**
   * 响应拦截器处理
   */
  handleResponse(response) {
    const { data, config } = response
    const endTime = new Date()
    const duration = endTime - config.metadata?.startTime
    
    console.log(`[API] ${config.url} 完成 (${duration}ms)`)
    
    // 处理业务状态码
    if (data.code && data.code !== 200) {
      const error = new Error(data.message || '请求失败')
      error.code = data.code
      return Promise.reject(error)
    }
    
    // 设置缓存
    if (this.isCacheable(config.url) && config.method === 'get') {
      this.setCache(config.url, config.params, data)
    }
    
    return data
  }

  /**
   * 响应错误处理
   */
  async handleResponseError(error) {
    console.error('[API] 响应错误:', error)
    
    // 处理重试
    if (this.shouldRetry(error)) {
      return this.retryRequest(error.config)
    }
    
    // 处理HTTP错误
    if (error.response) {
      this.handleHttpError(error.response)
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }

  /**
   * 处理HTTP错误
   */
  handleHttpError(response) {
    const { status, data } = response
    const errorMessage = ERROR_CODES.HTTP_ERROR[status] || data?.message || `请求失败 (${status})`
    
    switch (status) {
      case 401:
        // 显示后端返回的具体错误信息，比如"账号已被禁用"、"用户不存在"等
        const unauthorizedMessage = data?.error || data?.message || '未授权，请重新登录'
        ElMessage.error(unauthorizedMessage)
        this.redirectToLogin()
        break
      case 403:
        // 显示后端返回的具体错误信息，比如"没有权限"
        const forbiddenMessage = data?.error || data?.message || '禁止访问'
        ElMessage.error(forbiddenMessage)
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      default:
        ElMessage.error(errorMessage)
    }
  }

  /**
   * 判断是否需要重试
   */
  shouldRetry(error) {
    const config = error.config
    if (!config || config.retryCount >= RETRY_CONFIG.retries) {
      return false
    }
    
    return RETRY_CONFIG.retryCondition(error)
  }

  /**
   * 重试请求
   */
  async retryRequest(config) {
    const retryCount = config.retryCount || 0
    const newConfig = { ...config, retryCount: retryCount + 1 }
    
    console.log(`[API] 重试请求 ${config.url} (第${retryCount + 1}次)`)
    
    // 延迟重试
    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.retryDelay * (retryCount + 1)))
    
    return this.service(newConfig)
  }

  /**
   * 检查是否需要认证
   */
  requireAuth(url) {
    return API_PERMISSIONS.requireAuth.some(endpoint => url.includes(endpoint))
  }

  /**
   * 检查是否可缓存
   */
  isCacheable(url) {
    return CACHE_CONFIG.cacheableEndpoints.some(endpoint => url.includes(endpoint))
  }

  /**
   * 获取缓存
   */
  getCache(url, params) {
    const key = CACHE_CONFIG.generateCacheKey(url, params)
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    // 清理过期缓存
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  /**
   * 设置缓存
   */
  setCache(url, params, data) {
    const key = CACHE_CONFIG.generateCacheKey(url, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.defaultTTL
    })
  }

  /**
   * 获取token - 统一使用auth.js中定义的键名
   */


  /**
   * 跳转到登录页 - 统一清除auth信息
   */
  redirectToLogin() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('isLoggedIn')
    window.location.href = '/login'
  }

  /**
   * 启用Mock
   */
  enableMock() {
    // 这里可以集成Mock.js或其他Mock工具
    console.log('[API] Mock模式已启用')
  }

  /**
   * 通用请求方法
   */
  request(config) {
    return this.service(config)
  }

  /**
   * GET请求
   */
  get(url, params = {}, config = {}) {
    return this.service({
      method: 'get',
      url,
      params,
      ...config
    })
  }

  /**
   * POST请求
   */
  post(url, data = {}, config = {}) {
    return this.service({
      method: 'post',
      url,
      data,
      ...config
    })
  }

  /**
   * PUT请求
   */
  put(url, data = {}, config = {}) {
    return this.service({
      method: 'put',
      url,
      data,
      ...config
    })
  }

  /**
   * DELETE请求
   */
  delete(url, params = {}, config = {}) {
    return this.service({
      method: 'delete',
      url,
      params,
      ...config
    })
  }

  /**
   * 文件上传
   */
  upload(url, formData, config = {}) {
    return this.service({
      method: 'post',
      url,
      data: formData,
      headers: HEADERS.upload,
      ...config
    })
  }

  /**
   * 文件下载
   */
  download(url, params = {}, filename = '') {
    return this.service({
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

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 创建单例实例
const apiService = new ApiService()

export default apiService
