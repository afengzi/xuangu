/**
 * 内存使用监控工具
 * 用于监控和优化内存使用，避免内存泄漏
 */

class MemoryMonitor {
  constructor() {
    this.observers = new Map()
    this.checkInterval = null
    this.isMonitoring = false
  }

  /**
   * 开始监控内存使用
   */
  startMonitoring(interval = 30000) { // 默认30秒检查一次
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, interval)

    console.log('内存监控已启动，检查间隔:', interval / 1000, '秒')
  }

  /**
   * 停止监控
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isMonitoring = false
    console.log('内存监控已停止')
  }

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage() {
    if (!performance.memory) {
      console.warn('当前浏览器不支持内存监控')
      return
    }

    const memory = performance.memory
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

    // 内存使用率
    const usagePercent = Math.round((usedMB / limitMB) * 100)

    // 内存使用警告阈值
    const warningThreshold = 60 // 60%
    const criticalThreshold = 80 // 80%

    if (usagePercent > criticalThreshold) {
      console.error(`内存使用过高: ${usedMB}MB/${limitMB}MB (${usagePercent}%)`)
      this.triggerMemoryCleanup('critical')
    } else if (usagePercent > warningThreshold) {
      console.warn(`内存使用较高: ${usedMB}MB/${limitMB}MB (${usagePercent}%)`)
      this.triggerMemoryCleanup('warning')
    } else {
      console.log(`内存使用正常: ${usedMB}MB/${limitMB}MB (${usagePercent}%)`)
    }

    // 通知观察者
    this.notifyObservers({
      usedMB,
      totalMB,
      limitMB,
      usagePercent,
      status: usagePercent > criticalThreshold ? 'critical' : 
              usagePercent > warningThreshold ? 'warning' : 'normal'
    })
  }

  /**
   * 触发内存清理
   */
  triggerMemoryCleanup(level) {
    console.log(`触发内存清理 (${level})`)
    
    // 清理localStorage中的过期数据
    this.cleanupLocalStorage()
    
    // 强制垃圾回收（如果可用）
    if (window.gc && typeof window.gc === 'function') {
      window.gc()
      console.log('已触发垃圾回收')
    }

    // 通知观察者进行清理
    this.notifyObservers({ type: 'cleanup', level })
  }

  /**
   * 清理localStorage中的过期数据
   */
  cleanupLocalStorage() {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()
      let cleanedCount = 0

      keys.forEach(key => {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const data = JSON.parse(value)
            // 检查是否有时间戳且已过期
            if (data.timestamp && (now - new Date(data.timestamp).getTime()) > 7 * 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      })

      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 个过期的localStorage项目`)
      }
    } catch (error) {
      console.warn('清理localStorage失败:', error)
    }
  }

  /**
   * 添加内存监控观察者
   */
  addObserver(name, callback) {
    this.observers.set(name, callback)
  }

  /**
   * 移除观察者
   */
  removeObserver(name) {
    this.observers.delete(name)
  }

  /**
   * 通知所有观察者
   */
  notifyObservers(data) {
    this.observers.forEach((callback, name) => {
      try {
        callback(data)
      } catch (error) {
        console.warn(`内存监控观察者 ${name} 执行失败:`, error)
      }
    })
  }

  /**
   * 获取当前内存使用信息
   */
  getMemoryInfo() {
    if (!performance.memory) {
      return { error: '不支持内存监控' }
    }

    const memory = performance.memory
    return {
      usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    }
  }
}

// 创建单例实例
export const memoryMonitor = new MemoryMonitor()

/**
 * 自动启动内存监控（在开发环境下）
 */
if (process.env.NODE_ENV === 'development') {
  // 延迟启动，避免影响应用初始化
  setTimeout(() => {
    memoryMonitor.startMonitoring(60000) // 开发环境每分钟检查一次
  }, 5000)
}

/**
 * 页面卸载时停止监控
 */
window.addEventListener('beforeunload', () => {
  memoryMonitor.stopMonitoring()
})
