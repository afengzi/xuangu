/**
 * 热门概念题材数据缓存管理
 * 实现每日固定导入一次，其余时间使用静态数据
 */

const THEMES_CACHE_KEY = 'hot_themes_cache'
const CACHE_VERSION = '1.2'
const DAILY_UPDATE_TIME = '08:35' // 每日更新时间，略晚于后端更新时间08:30
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12小时缓存，更频繁更新
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 最大缓存7天
const REFRESH_THRESHOLD = 2 * 60 * 60 * 1000 // 2小时强制刷新阈值

class ThemesCache {
  constructor() {
    this.cache = null
    this.lastUpdateTime = null
    this.isLoading = false
    this.loadPromise = null
    this.updateInProgress = false
  }

  /**
   * 获取缓存的题材数据
   */
  getCachedThemes() {
    try {
      const cached = localStorage.getItem(THEMES_CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        
        // 检查版本和缓存有效性
        if (data.version === CACHE_VERSION && this.isCacheValid(data.lastUpdate)) {
          this.cache = data.themes
          this.lastUpdateTime = data.lastUpdate
          return this.cache
        }
      }
    } catch (error) {
      console.warn('读取题材缓存失败:', error)
    }
    return null
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(lastUpdateTime) {
    if (!lastUpdateTime) return false
    
    const now = new Date()
    const lastUpdate = new Date(lastUpdateTime)
    const age = now.getTime() - lastUpdate.getTime()
    
    // 缓存未过期且在有效期内
    return age < CACHE_DURATION && age < MAX_CACHE_AGE
  }

  /**
   * 保存题材数据到缓存
   */
  setCachedThemes(themes) {
    try {
      const cacheData = {
        themes,
        lastUpdate: new Date().toISOString(),
        version: CACHE_VERSION
      }
      localStorage.setItem(THEMES_CACHE_KEY, JSON.stringify(cacheData))
      this.cache = themes
      this.lastUpdateTime = cacheData.lastUpdate
    } catch (error) {
      console.warn('保存题材缓存失败:', error)
    }
  }

  /**
   * 检查是否需要更新（优化版本，更智能的更新策略）
   */
  shouldUpdate() {
    // 如果正在更新中，不需要重复更新
    if (this.updateInProgress) {
      return false
    }

    // 如果还没有缓存，需要更新
    const cached = this.getCachedThemes()
    if (!cached) {
      return true
    }

    // 检查缓存是否过期
    if (!this.isCacheValid(this.lastUpdateTime)) {
      return true
    }

    const now = new Date()
    const lastUpdate = new Date(this.lastUpdateTime)
    const timeSinceUpdate = now.getTime() - lastUpdate.getTime()
    
    // 强制刷新策略：超过2小时且到了更新时间
    if (timeSinceUpdate > REFRESH_THRESHOLD) {
      const currentTime = now.toTimeString().slice(0, 5) // HH:MM
      if (currentTime >= DAILY_UPDATE_TIME) {
        const lastUpdateDate = lastUpdate.toDateString()
        const today = now.toDateString()
        
        // 如果今天还没有更新过，或者上次更新在今天的数据更新时间之前
        if (lastUpdateDate !== today) {
          return true
        }
        
        // 如果今天已经更新过，但更新时间在今天的数据更新时间之前，也需要更新
        const lastUpdateTime = lastUpdate.toTimeString().slice(0, 5)
        if (lastUpdateTime < DAILY_UPDATE_TIME) {
          return true
        }
      }
    }

    // 页面刷新检测：如果页面刚刚刷新（通过sessionStorage检测），强制更新
    if (this.isPageRefresh()) {
      return true
    }

    return false
  }

  /**
   * 检查是否是今天的日期
   */
  isToday(dateString) {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  /**
   * 检查是否是页面刷新（通过sessionStorage检测）
   */
  isPageRefresh() {
    try {
      const pageLoadTime = sessionStorage.getItem('page_load_time')
      const now = Date.now()
      
      if (!pageLoadTime) {
        // 首次加载，设置页面加载时间
        sessionStorage.setItem('page_load_time', now.toString())
        return false
      }
      
      const loadTime = parseInt(pageLoadTime)
      const timeSinceLoad = now - loadTime
      
      // 如果页面加载时间小于5分钟，认为是页面刷新
      if (timeSinceLoad < 5 * 60 * 1000) {
        return true
      }
      
      // 更新页面加载时间
      sessionStorage.setItem('page_load_time', now.toString())
      return false
    } catch (error) {
      console.warn('检查页面刷新状态失败:', error)
      return false
    }
  }

  /**
   * 获取缓存状态信息
   */
  getCacheInfo() {
    const cached = this.getCachedThemes()
    return {
      hasCache: !!cached,
      lastUpdate: this.lastUpdateTime,
      count: cached ? cached.length : 0,
      shouldUpdate: this.shouldUpdate()
    }
  }

  /**
   * 清理缓存
   */
  clearCache() {
    try {
      localStorage.removeItem(THEMES_CACHE_KEY)
      this.cache = null
      this.lastUpdateTime = null
    } catch (error) {
      console.warn('清理题材缓存失败:', error)
    }
  }
}

// 创建单例实例
export const themesCache = new ThemesCache()

/**
 * 智能获取题材数据（优化版本，防重复调用和内存优化）
 * 优先使用缓存，需要时自动更新
 */
export async function getThemesData(getAllThemesApi) {
  // 1. 如果正在加载中，返回现有的Promise，避免重复调用
  if (themesCache.isLoading && themesCache.loadPromise) {
    return themesCache.loadPromise
  }

  // 2. 先尝试从缓存获取
  const cachedThemes = themesCache.getCachedThemes()
  if (cachedThemes && !themesCache.shouldUpdate()) {
    return {
      themes: cachedThemes,
      fromCache: true,
      lastUpdate: themesCache.lastUpdateTime
    }
  }

  // 3. 需要更新，设置加载状态并调用API
  themesCache.isLoading = true
  themesCache.updateInProgress = true

  themesCache.loadPromise = (async () => {
    try {
      const resp = await getAllThemesApi()
      const themes = resp?.themes || []
      
      // 4. 保存到缓存
      themesCache.setCachedThemes(themes)
      
      return {
        themes,
        fromCache: false,
        lastUpdate: themesCache.lastUpdateTime
      }
    } catch (error) {
      // 5. API失败时，尝试使用过期缓存
      const staleCache = themesCache.getCachedThemes()
      if (staleCache) {
        return {
          themes: staleCache,
          fromCache: true,
          lastUpdate: themesCache.lastUpdateTime,
          isStale: true
        }
      }
      throw error
    } finally {
      // 6. 清理加载状态
      themesCache.isLoading = false
      themesCache.updateInProgress = false
      themesCache.loadPromise = null
    }
  })()

  return themesCache.loadPromise
}

/**
 * 预加载题材数据（在应用启动时调用，优化版本）
 */
export async function preloadThemesData(getAllThemesApi) {
  try {
    // 检查缓存状态
    const cacheInfo = themesCache.getCacheInfo()
    
    if (cacheInfo.shouldUpdate) {
      // 立即加载，确保界面刷新时有数据可用
      const result = await getThemesData(getAllThemesApi)
      
      return result
    } else {
      // 即使不需要更新，也返回缓存数据
      const cachedThemes = themesCache.getCachedThemes()
      return {
        themes: cachedThemes || [],
        fromCache: true,
        lastUpdate: cacheInfo.lastUpdate
      }
    }
  } catch (error) {
    console.warn('预加载题材数据失败:', error)
    throw error
  }
}

/**
 * 手动刷新题材数据（用于调试或强制更新）
 */
export async function refreshThemesData(getAllThemesApi) {
  themesCache.clearCache()
  return await getThemesData(getAllThemesApi)
}

/**
 * 强制刷新题材数据（忽略缓存，直接获取最新数据）
 */
export async function forceRefreshThemesData(getAllThemesApi) {
  // 清除更新状态，允许强制更新
  themesCache.updateInProgress = false
  themesCache.isLoading = false
  themesCache.loadPromise = null
  
  // 清除缓存
  themesCache.clearCache()
  
  // 强制更新
  return await getThemesData(getAllThemesApi)
}

/**
 * 获取缓存状态信息（用于调试）
 */
export function getThemesCacheInfo() {
  return themesCache.getCacheInfo()
}
