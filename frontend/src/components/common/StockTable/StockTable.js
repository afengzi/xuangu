/**
 * 股票表格组件业务逻辑
 */

import { ref, onUnmounted, nextTick } from 'vue'
import { 
  formatStockAnalysisUrl,
  formatTreeIdUrl,
  handleStockCodeClick,
  formatMoney,
  formatYiYuan,
  formatPercent,
  formatNumber
} from '../../../utils/formatters/stockFormatters.js'
import { getDetailInfoByCode } from '../../../api/stockAPI.js'
import { monitorApiRequest } from '../../../utils/performance.js'
import { memoryOptimizer } from '../../../utils/memoryOptimizer.js'

/**
 * 股票表格组件逻辑
 */
export function useStockTable() {
  const currentPage = ref(1)
  const pageSize = ref(20)
  const tableRenderKey = ref(0)
  const tableRef = ref(null)
  
  // 表格排序 - 使用普通对象减少响应式开销，初始值将在组件中动态设置
  const currentSort = { prop: null, order: null }
  
  // 性能优化：股票悬浮提示相关
  const stockTooltips = ref({})
  const loadingStocks = ref(new Set())
  const tooltipCache = ref(new Map()) // 新增缓存
  const CACHE_DURATION = 2 * 60 * 1000 // 2分钟缓存，进一步减少内存占用
  const MAX_CACHE_SIZE = 50 // 最大缓存数量，防止无限增长

  /**
   * 处理股票名称悬浮事件 - 性能优化版本
   */
  const handleStockNameHover = async (stockCode) => {
    // 检查缓存
    const cacheKey = `tooltip_${stockCode}`
    const cached = tooltipCache.value.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      stockTooltips.value = {
        ...stockTooltips.value,
        [stockCode]: cached.data
      }
      return
    }

    // 如果已经有数据或正在加载，直接返回
    if (stockTooltips.value[stockCode] || loadingStocks.value.has(stockCode)) {
      return
    }
    
    // 立即设置加载状态
    loadingStocks.value.add(stockCode)
    
    try {
      // 使用性能监控包装API请求
      const response = await monitorApiRequest(`stock_detail_${stockCode}`, () => 
        getDetailInfoByCode(stockCode)
      )
      
      // 调试信息已删除
      
      let data = null
      // 修改这里：正确处理响应数据
      if (response && typeof response === 'object') {
        // 直接检查响应对象中的数据字段
        if (response.latest_theme || response.recent_fluctuation_theme) {
          data = response
        } else if (response.data && (response.data.latest_theme || response.data.recent_fluctuation_theme)) {
          data = response.data
        }
        // 添加对响应结构的更多兼容处理
        else if (response.data) {
          // 如果data字段存在但没有预期的字段，直接使用data字段
          data = response.data
        }
      }
      
      // 调试信息已删除
      
      if (data) {
        // 验证数据结构，确保有必要的字段
        const validatedData = {
          latest_theme: data.latest_theme || data.latestTheme || data.theme || '',
          recent_fluctuation_theme: data.recent_fluctuation_theme || data.recentFluctuationTheme || data.fluctuation_theme || '',
          ...data // 保留原始数据的所有字段
        }
        
        // 强制更新响应式数据
        stockTooltips.value = {
          ...stockTooltips.value,
          [stockCode]: validatedData
        }
        
        // 缓存数据
        tooltipCache.value.set(cacheKey, {
          data: validatedData,
          timestamp: Date.now()
        })
        
        // 强制触发Vue的响应式更新
        await nextTick()
        
        // 立即清理加载状态，确保UI及时更新
        loadingStocks.value.delete(stockCode)
      } else {
        stockTooltips.value = {
          ...stockTooltips.value,
          [stockCode]: { error: true }
        }
        loadingStocks.value.delete(stockCode)
      }
    } catch (error) {
      console.error('获取股票详情失败:', error)
      stockTooltips.value = {
        ...stockTooltips.value,
        [stockCode]: { error: true }
      }
      loadingStocks.value.delete(stockCode)
    }
  }


  /**
   * 获取股票悬浮提示内容 - 性能优化版本
   */
  const getStockTooltipContent = (stockCode) => {
    const data = stockTooltips.value[stockCode]
    // 移除加载状态的判断，直接显示数据或空内容
    // const isLoading = loadingStocks.value.has(stockCode)
    
    // if (isLoading) return '<div style="padding: 6px; font-size: 12px;">加载中...</div>'
    if (data && data.error) return '<div style="padding: 6px; font-size: 12px;">获取信息失败</div>'
    if (!data) return '' // 直接返回空字符串而不是"暂无详细信息"

    // 简化tooltip内容，减少HTML复杂度
    const lines = []
    
    if (data.latest_theme) {
      lines.push(data.latest_theme)
      lines.push('')
    }
    
    if (data.recent_fluctuation_theme) {
      lines.push(data.recent_fluctuation_theme)
    }
    
    // 如果没有数据，返回空字符串
    if (lines.length === 0) {
      return ''
    }
    
    // 简化HTML结构
    return `
      <div style="padding: 6px; font-size: 12px; max-width: 280px;">
        ${lines.join('<br>').replace(/\n/g, '<br>')}
      </div>
    `
  }

  /**
   * 处理股票代码点击事件 - 性能优化版本
   */
  const onCodeClick = (evt, code) => {
    // 使用防抖避免重复点击
    if (evt.target.dataset.clicking === 'true') {
      return
    }
    evt.target.dataset.clicking = 'true'
    
    setTimeout(() => {
      evt.target.dataset.clicking = 'false'
    }, 1000)

    return handleStockCodeClick(evt, code)
  }

  /**
   * 判断列是否可排序
   */
  const isSortableColumn = (col) => {
    // 不可排序的列
    const nonSortableColumns = [
      '股票简称', 
      '题材描述', 
      '主题',
      // 技术面相关列
      'MACD',
      'KDJ', 
      'BOLL',
      '单k组合',
      '均线'
    ]
    
    // 如果是不排序的列，返回false
    if (nonSortableColumns.includes(col)) {
      return false
    }
    
    // 其他列都可以排序（包括股票代码）
    return true
  }

  // 清理缓存
  const cleanupCache = () => {
    const now = Date.now()
    const cache = tooltipCache.value
    
    // 1. 清理过期缓存
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key)
      }
    }
    
    // 2. 如果缓存仍然过大，删除最旧的条目
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE + 20) // 删除到80%大小
      toDelete.forEach(([key]) => cache.delete(key))
    }
    
    // 3. 清理stockTooltips中的过期数据
    const tooltipKeys = Object.keys(stockTooltips.value)
    if (tooltipKeys.length > MAX_CACHE_SIZE) {
      // 只保留最近的数据，删除多余的
      const keepCount = Math.floor(MAX_CACHE_SIZE * 0.8)
      const keysToDelete = tooltipKeys.slice(0, tooltipKeys.length - keepCount)
      keysToDelete.forEach(key => delete stockTooltips.value[key])
    }
  }

  // 定期清理缓存 - 适度的清理以减少内存占用
  const cleanupInterval = setInterval(cleanupCache, 60000) // 每60秒清理一次，避免过于频繁


  // 组件卸载时清理
  onUnmounted(() => {
    // 清理定时器
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
    
    // 清理所有缓存和状态
    tooltipCache.value.clear()
    stockTooltips.value = {}
    loadingStocks.value.clear()
    
    // 执行内存优化清理任务
    memoryOptimizer.executeCleanupTasks()
    
    // 强制垃圾回收（如果可用）
    if (window.gc && typeof window.gc === 'function') {
      window.gc()
    }
  })

  return {
    // 状态
    currentPage,
    pageSize,
    tableRenderKey,
    tableRef,
    currentSort,
    stockTooltips,
    loadingStocks,
    tooltipCache, // 导出tooltipCache以便在其他地方使用
    
    // 方法
    handleStockNameHover,
    getStockTooltipContent,
    onCodeClick,
    isSortableColumn,
    
    // 格式化函数
    formatStockAnalysisUrl,
    formatTreeIdUrl,
    handleStockCodeClick,
    formatMoney,
    formatYiYuan,
    formatPercent,
    formatNumber
  }
}
