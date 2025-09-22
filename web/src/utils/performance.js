/**
 * 性能监控工具
 * 专门针对光大证券浏览器等嵌入式浏览器环境优化
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.startTime = performance.now()
    this.isGuangdaBrowser = this.checkGuangdaBrowser()
    this.compatibilityIssues = this.checkCompatibility()
  }

  // 记录性能指标
  recordMetric(name, value) {
    this.metrics.set(name, value)
  }

  // 开始计时
  startTimer(name) {
    this.metrics.set(`${name}_start`, performance.now())
  }

  // 结束计时
  endTimer(name) {
    const start = this.metrics.get(`${name}_start`)
    if (start) {
      const duration = performance.now() - start
      this.metrics.set(name, duration)
      this.metrics.delete(`${name}_start`)
      return duration
    }
    return 0
  }

  // 检查是否在光大证券浏览器中
  checkGuangdaBrowser() {
    const ua = navigator.userAgent.toLowerCase()
    return ua.includes('guangda') || ua.includes('光大') || ua.includes('gd') || 
           ua.includes('tdx') || ua.includes('tongdaxin') || ua.includes('通达信')
  }

  // 浏览器兼容性检查
  checkCompatibility() {
    const issues = []
    
    // 检查关键API支持
    if (!window.requestAnimationFrame) {
      issues.push('requestAnimationFrame not supported')
    }
    
    if (!window.IntersectionObserver) {
      issues.push('IntersectionObserver not supported')
    }
    
    // 检查CSS支持
    const testEl = document.createElement('div')
    testEl.style.cssText = 'backdrop-filter: blur(10px);'
    if (!testEl.style.backdropFilter) {
      issues.push('backdrop-filter not supported')
    }
    
    // 检查WebGL支持（用于某些动画）
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      issues.push('WebGL not supported')
    }
    
    return issues
  }

  // 获取性能报告
  getReport() {
    const report = {
      totalTime: performance.now() - this.startTime,
      metrics: Object.fromEntries(this.metrics),
      isGuangdaBrowser: this.isGuangdaBrowser,
      compatibilityIssues: this.compatibilityIssues,
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date().toISOString()
    }
    
    // 在开发环境下输出报告
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Report:', report)
    }
    
    // 清理旧的指标数据，防止内存泄漏
    this.cleanupOldMetrics()
    
    return report
  }

  // 清理旧的性能指标数据
  cleanupOldMetrics() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5分钟
    
    // 如果指标数据过多，清理最旧的
    if (this.metrics.size > 50) {
      const entries = Array.from(this.metrics.entries())
      const toDelete = entries.slice(0, entries.length - 30) // 保留最新的30个
      toDelete.forEach(([key]) => this.metrics.delete(key))
    }
  }

  // 获取内存使用情况
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }

  // 监控表格渲染性能
  monitorTableRender(tableName, renderFn) {
    this.startTimer(`table_${tableName}_render`)
    const result = renderFn()
    const duration = this.endTimer(`table_${tableName}_render`)
    
    // 如果渲染时间超过100ms，记录警告
    if (duration > 100) {
      console.warn(`Table ${tableName} render time exceeded 100ms:`, duration + 'ms')
    }
    
    return result
  }

  // 监控API请求性能
  monitorApiRequest(url, requestFn) {
    this.startTimer(`api_${url}`)
    return requestFn().finally(() => {
      const duration = this.endTimer(`api_${url}`)
      
      // 如果请求时间超过2秒，记录警告
      if (duration > 2000) {
        console.warn(`API ${url} request time exceeded 2s:`, duration + 'ms')
      }
    })
  }

  // 优化建议
  getOptimizationSuggestions() {
    const suggestions = []
    const report = this.getReport()
    
    // 检查总加载时间
    if (report.totalTime > 3000) {
      suggestions.push('页面加载时间超过3秒，建议优化初始渲染性能')
    }
    
    // 检查内存使用
    if (report.memoryUsage && report.memoryUsage.usedJSHeapSize > 50 * 1024 * 1024) {
      suggestions.push('内存使用超过50MB，建议检查内存泄漏')
    }
    
    // 检查兼容性问题
    if (this.compatibilityIssues.length > 0) {
      suggestions.push(`检测到兼容性问题: ${this.compatibilityIssues.join(', ')}`)
    }
    
    // 针对光大证券浏览器的特殊建议
    if (this.isGuangdaBrowser) {
      suggestions.push('检测到光大证券浏览器环境，已启用兼容性优化')
    }
    
    return suggestions
  }
}

export const performanceMonitor = new PerformanceMonitor()

// 页面加载完成后检查性能
window.addEventListener('load', () => {
  setTimeout(() => {
    const report = performanceMonitor.getReport()
    const suggestions = performanceMonitor.getOptimizationSuggestions()
    
    if (suggestions.length > 0) {
      console.warn('Performance Optimization Suggestions:', suggestions)
    }
    
    // 在光大证券浏览器中显示特殊提示
    if (performanceMonitor.isGuangdaBrowser) {
      console.log('Running in Guangda Securities Browser - Performance optimizations applied')
    }
  }, 1000)
})

// 定期内存检查（每3分钟检查一次，减少检查频率）
let memoryCheckInterval = null
if (performance.memory) {
  memoryCheckInterval = setInterval(() => {
    const memoryUsage = performanceMonitor.getMemoryUsage()
    if (memoryUsage && memoryUsage.usedJSHeapSize > 40 * 1024 * 1024) {
      console.warn('内存使用过高，建议刷新页面或检查内存泄漏')
    }
  }, 3 * 60 * 1000) // 3分钟检查一次
}

// 页面卸载时清理内存检查定时器
window.addEventListener('beforeunload', () => {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval)
  }
})

// 导出工具函数
export const monitorTableRender = (tableName, renderFn) => {
  return performanceMonitor.monitorTableRender(tableName, renderFn)
}

export const monitorApiRequest = (url, requestFn) => {
  return performanceMonitor.monitorApiRequest(url, requestFn)
}

export const getPerformanceReport = () => {
  return performanceMonitor.getReport()
}

export const getOptimizationSuggestions = () => {
  return performanceMonitor.getOptimizationSuggestions()
}
