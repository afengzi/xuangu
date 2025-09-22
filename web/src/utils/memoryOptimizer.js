/**
 * 内存优化工具
 * 提供各种内存优化策略和工具函数
 */

/**
 * 内存优化管理器
 */
class MemoryOptimizer {
  constructor() {
    this.cleanupTasks = new Set()
    this.optimizationEnabled = true
    this.memoryThreshold = 40 * 1024 * 1024 // 40MB阈值
  }

  /**
   * 添加清理任务
   * @param {Function} task - 清理任务函数
   */
  addCleanupTask(task) {
    this.cleanupTasks.add(task)
  }

  /**
   * 移除清理任务
   * @param {Function} task - 清理任务函数
   */
  removeCleanupTask(task) {
    this.cleanupTasks.delete(task)
  }

  /**
   * 执行所有清理任务
   */
  executeCleanupTasks() {
    this.cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.warn('清理任务执行失败:', error)
      }
    })
  }

  /**
   * 检查内存使用情况并触发优化
   */
  checkAndOptimize() {
    if (!window.performance || !window.performance.memory) {
      return false
    }

    const memory = window.performance.memory
    const usedMemory = memory.usedJSHeapSize

    if (usedMemory > this.memoryThreshold) {
      console.log(`内存使用: ${(usedMemory / (1024 * 1024)).toFixed(2)}MB，触发优化`)
      this.executeCleanupTasks()
      
      // 强制垃圾回收（如果可用）
      if (window.gc && typeof window.gc === 'function') {
        window.gc()
      }
      
      return true
    }
    return false
  }

  /**
   * 优化对象属性，移除不必要的属性
   * @param {Object} obj - 要优化的对象
   * @param {Array} keepProps - 需要保留的属性
   */
  optimizeObject(obj, keepProps = []) {
    if (!obj || typeof obj !== 'object') return obj

    const optimized = {}
    keepProps.forEach(prop => {
      if (obj.hasOwnProperty(prop)) {
        optimized[prop] = obj[prop]
      }
    })
    return optimized
  }

  /**
   * 清理数组中的重复项
   * @param {Array} arr - 要清理的数组
   * @returns {Array} 清理后的数组
   */
  deduplicateArray(arr) {
    if (!Array.isArray(arr)) return arr
    return [...new Set(arr)]
  }

  /**
   * 清理Map或Set中的过期项
   * @param {Map|Set} collection - 要清理的集合
   * @param {Function} isExpired - 判断是否过期的函数
   */
  cleanupCollection(collection, isExpired) {
    if (!collection || typeof isExpired !== 'function') return

    const toDelete = []
    for (const [key, value] of collection.entries()) {
      if (isExpired(value)) {
        toDelete.push(key)
      }
    }
    
    toDelete.forEach(key => collection.delete(key))
  }
}

// 创建全局实例
export const memoryOptimizer = new MemoryOptimizer()

/**
 * 字符串缓存优化器
 */
class StringCache {
  constructor(maxSize = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key) {
    return this.cache.get(key)
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

export const stringCache = new StringCache()

/**
 * 对象池管理器
 */
class ObjectPool {
  constructor(createFn, resetFn, maxSize = 50) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
    this.pool = []
  }

  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop()
    }
    return this.createFn()
  }

  release(obj) {
    if (this.pool.length < this.maxSize && obj) {
      this.resetFn(obj)
      this.pool.push(obj)
    }
  }

  clear() {
    this.pool.length = 0
  }
}

export const createObjectPool = (createFn, resetFn, maxSize) => {
  return new ObjectPool(createFn, resetFn, maxSize)
}

/**
 * 防抖函数 - 内存优化版本
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  const debounced = function(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
  
  debounced.cancel = () => {
    clearTimeout(timeout)
    timeout = null
  }
  
  return debounced
}

/**
 * 节流函数 - 内存优化版本
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 页面卸载时执行清理
window.addEventListener('beforeunload', () => {
  memoryOptimizer.executeCleanupTasks()
  stringCache.clear()
})
