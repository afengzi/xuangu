/**
 * 股票筛选业务逻辑组合式函数
 * 提供股票筛选相关的状态管理和业务逻辑
 */

import { ref, reactive, computed, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getStocksByFactorsSelection, getMultiThemeAndFactorInfo, getThemesInfo, getZhibiaoInfo, getCombinedFilterInfo } from '../api/stockAPI.js'
// 统一复用 shared 核心
const StockFilter = (typeof window !== 'undefined' && window.StockFilterFactory) ? window.StockFilterFactory() : null
const collectFactors = (all = {}) => {
  if (StockFilter && typeof StockFilter.collectFactors === 'function') {
    return StockFilter.collectFactors(all)
  }
  // 兜底：最小实现，避免报错
  return {
    factors: [],
    selectedFactors: { fundamental: [], technical: [], capital: [] },
    themes: Array.isArray(all?.hotConcept?.themes) ? all.hotConcept.themes : [],
    indicator: all?.indicator?.special || ''
  }
}
const processStockData = (rows = [], selectedFactors = {}) => {
  if (StockFilter && typeof StockFilter.processStockData === 'function') {
    return StockFilter.processStockData(rows, selectedFactors)
  }
  return Array.isArray(rows) ? rows.map(x => {
    const out = { '股票代码': x.code || x['股票代码'] || '' }
    Object.keys(x || {}).forEach(k => { if (k !== 'code' && k !== 'con_code') out[k] = x[k] })
    return out
  }) : []
}
// processFilterChange 为页面独有流程，保留本地实现
import { DEFAULT_CODE_COLUMNS } from '../utils/formatters/stockFormatters.js'

// 固定列顺序的函数
const orderColumns = (columns) => {
  if (!Array.isArray(columns)) return columns
  
  const orderedColumns = []
  const otherColumns = []
  
  // 第一优先级：股票代码
  if (columns.includes('股票代码')) {
    orderedColumns.push('股票代码')
  }
  
  // 第二优先级：股票简称
  if (columns.includes('股票简称')) {
    orderedColumns.push('股票简称')
  }
  
  // 其他列按原始顺序添加
  columns.forEach(col => {
    if (col !== '股票代码' && col !== '股票简称') {
      otherColumns.push(col)
    }
  })
  
  return [...orderedColumns, ...otherColumns]
}

// 本地页面流程控制：处理筛选条件变化（保留，仅此一处定义）
const processFilterChange = (filterData, options = {}) => {
  const {
    isThemeMode = false,
    themeColumns = [],
    dataColumns = [],
    DEFAULT_CODE_COLUMNS = []
  } = options

  // 特色指标：仅选指标时走静态；与题材/因子组合时走常规搜索
  if (filterData?.category === 'indicator' && filterData?.condition === 'special') {
    const selected = filterData?.value
    const all = filterData?.allFilters || {}
    if (!selected) {
      return {
        shouldSkip: false,
        result: {
          stockList: [],
          isThemeMode: false,
          themeColumns: [],
          dataColumns: [],
          showTimeFilter: false,
          lastIndicatorSelected: ''
        }
      }
    }

    // 是否还有其他条件（题材或因子）
    const hasOther = Object.keys(all).some(k => {
      if (k === 'indicator') return false
      if (k === 'hotConcept') return Array.isArray(all?.hotConcept?.themes) && all.hotConcept.themes.length > 0
      const cat = all[k]
      return cat && Object.values(cat).some(v => !!v)
    })

    if (!hasOther) {
      // 只有指标 -> 静态数据
      return {
        shouldSkip: false,
        result: { selected, isStaticData: true }
      }
    }
    // 有其它条件 -> 继续由常规搜索分支处理
  }

  // 常规筛选条件处理
  const next = filterData.allFilters || {}

  // 若全部条件被清空：清空结果并返回，同时重置默认排序为股票代码升序
  if (Object.keys(next).length === 0) {
    return {
      shouldSkip: false,
      result: {
        stockList: [],
        isThemeMode: false,
        themeColumns: [],
        dataColumns: [],
        currentSort: { prop: '股票代码', order: 'ascending' }
      }
    }
  }

  return {
    shouldSkip: false,
    result: {
      filters: next,
      shouldSearch: true
    }
  }
}

export function useStockFilter() {
  // 响应式状态
  const currentFilters = reactive({})
  const stockList = ref([])
  const isThemeMode = ref(false)
  const themeColumns = ref([])
  const dataColumns = ref([])
  const searchLoading = ref(false)
  const showStockDetail = ref(false)
  const currentStock = ref(null)
  const autoTimer = ref(null)
  
  // 缓存机制
  const queryCache = ref(new Map())
  const CACHE_DURATION = 2 * 60 * 1000 // 2分钟缓存，进一步减少内存占用
  const MAX_CACHE_SIZE = 30 // 最大缓存数量，防止无限增长
  
  // 缓存相关函数
  const getCacheKey = (type, params) => {
    return `${type}:${JSON.stringify(params)}`
  }
  
  const getFromCache = (cacheKey) => {
    const cached = queryCache.value.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }
    return null
  }
  
  const setCache = (cacheKey, data) => {
    // 检查缓存大小，如果过大则清理
    if (queryCache.value.size >= MAX_CACHE_SIZE) {
      cleanupQueryCache()
    }
    
    queryCache.value.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  // 清理查询缓存
  const cleanupQueryCache = () => {
    const now = Date.now()
    const cache = queryCache.value
    
    // 清理过期缓存
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key)
      }
    }
    
    // 如果缓存仍然过大，删除最旧的条目
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, cache.size - Math.floor(MAX_CACHE_SIZE * 0.8))
      toDelete.forEach(([key]) => cache.delete(key))
    }
  }
  
  const showTimeFilter = ref(false)
  const dateRange = ref([])
  const lastIndicatorSelected = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)
  const tableRenderKey = ref(0)
  const tableRef = ref(null)
  const currentSort = reactive({ prop: 'code', order: 'ascending' })

  // 计算属性
  const paginatedStockList = computed(() => {
    const list = [...stockList.value]
    
    // 排序逻辑
    if (currentSort.prop) {
      const { prop, order } = currentSort
      const factor = order === 'descending' ? -1 : 1
      
      list.sort((a, b) => {
        const av = a[prop]
        const bv = b[prop]
        
        // 数字排序
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * factor
        }
        
        // 字符串排序
        return String(av ?? '').localeCompare(String(bv ?? '')) * factor
      })
    }

    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return list.slice(start, end)
  })

  // 处理筛选条件变化
  const handleFilterChange = (filterData) => {
    const result = processFilterChange(filterData, {
      isThemeMode: isThemeMode.value,
      themeColumns: themeColumns.value,
      dataColumns: dataColumns.value,
      DEFAULT_CODE_COLUMNS
    })

    if (result.shouldSkip) {
      return
    }

    // 更新当前筛选条件
    Object.assign(currentFilters, filterData.allFilters || {})

    // 处理特殊结果
    if (result.result) {
      const { stockList: newStockList, isThemeMode: newIsThemeMode, themeColumns: newThemeColumns, dataColumns: newDataColumns, showTimeFilter: newShowTimeFilter, lastIndicatorSelected: newLastIndicatorSelected, selected, isStaticData, currentSort } = result.result

      if (newStockList !== undefined) {
        stockList.value = newStockList
      }
      if (newIsThemeMode !== undefined) {
        isThemeMode.value = newIsThemeMode
      }
      if (newThemeColumns !== undefined) {
        themeColumns.value = newThemeColumns
      }
      if (newDataColumns !== undefined) {
        dataColumns.value = newDataColumns
      }
      if (newShowTimeFilter !== undefined) {
        showTimeFilter.value = newShowTimeFilter
      }
      if (newLastIndicatorSelected !== undefined) {
        lastIndicatorSelected.value = newLastIndicatorSelected
      }
      if (currentSort !== undefined) {
        currentSort.prop = currentSort.prop
        currentSort.order = currentSort.order
      }

      // 处理静态数据
      if (isStaticData && selected) {
        handleStaticIndicatorData(selected)
        return
      }

      // 如果是清空结果，直接返回，不触发搜索
      if (newStockList !== undefined && newStockList.length === 0 && Object.keys(filterData.allFilters || {}).length === 0) {
        return
      }
    }

    // 自动触发搜索（防抖）
    if (autoTimer.value) {
      clearTimeout(autoTimer.value)
    }
    autoTimer.value = setTimeout(() => {
      handleSearch({ ...currentFilters }, { silent: false })
    }, 400)
  }

  // 处理搜索（支持静默模式：自动触发时也显示提示）
  const handleSearch = async (filters = { ...currentFilters }, options = {}) => {
    const silent = !!options.silent
    searchLoading.value = true
    currentPage.value = 1

    try {
      const { factors, selectedFactors, themes, indicator } = collectFactors(filters)
      
      if (factors.length === 0 && themes.length === 0 && !indicator) {
        stockList.value = []
        isThemeMode.value = false
        themeColumns.value = []
        dataColumns.value = []
        searchLoading.value = false
        return
      }

      let cacheKey, resp
      if ((themes.length > 0 || factors.length > 0) && indicator) {
        cacheKey = getCacheKey('themes_factors_zhibiao', { themes, factors, indicator })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getCombinedFilterInfo(themes, factors, indicator)
          setCache(cacheKey, resp)
        }
      } else if (themes.length > 0 && factors.length > 0) {
        cacheKey = getCacheKey('multi_theme_factor', { themes, factors })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getMultiThemeAndFactorInfo(themes, factors)
          setCache(cacheKey, resp)
        }
      } else if (themes.length > 0) {
        cacheKey = getCacheKey('themes', { themes })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getThemesInfo(themes)
          setCache(cacheKey, resp)
        }
      } else if (factors.length > 0) {
        cacheKey = getCacheKey('factors', { factors })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getStocksByFactorsSelection(factors)
          setCache(cacheKey, resp)
        }
      } else if (indicator) {
        // 防御：若只有指标但仍走到这里，退回静态接口
        resp = await getZhibiaoInfo(indicator)
      }

      const dRaw = resp?.data ?? resp
      let d = dRaw
      
      if (Array.isArray(dRaw)) {
        d = dRaw
      } else if (dRaw?.stocks) {
        d = dRaw.stocks
      } else if (dRaw?.data) {
        d = dRaw.data
      } else if (typeof dRaw === 'object' && dRaw !== null) {
        // 处理对象格式：将对象转换为数组
        d = Object.entries(dRaw).map(([code, data]) => {
          // 如果数据是空对象，创建一个基本的股票对象
          if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
            return {
              '股票代码': code,
              '股票简称': `股票${code}` // 临时名称
            }
          }
          // 如果有数据，合并股票代码
          return {
            '股票代码': code,
            ...data
          }
        })
      }

      const rows = Array.isArray(d) ? d : []
      
      if (themes.length > 0 || (themes.length > 0 && factors.length > 0)) {
        // 题材模式
        const processed = processStockData(rows, selectedFactors)
        stockList.value = processed
        isThemeMode.value = true
        // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
        themeColumns.value = processed.length > 0 ? orderColumns(Object.keys(processed[0])) : []
        dataColumns.value = []
        showTimeFilter.value = true
      } else {
        // 常规模式
        const processed = processStockData(rows, selectedFactors)
        stockList.value = processed
        isThemeMode.value = false
        themeColumns.value = []
        // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
        dataColumns.value = processed.length > 0 ? orderColumns(Object.keys(processed[0])) : DEFAULT_CODE_COLUMNS
        showTimeFilter.value = false
      }
      
      if (!silent) {
        rows.length ? ElMessage.success(`搜索完成，搜索到${rows.length}支股票`) : ElMessage.info('未找到符合条件的股票')
      }
    } catch (error) {
      stockList.value = []
      if (!silent) ElMessage.error('搜索失败，请稍后重试')
    } finally {
      searchLoading.value = false
    }
  }

  // 处理静态指标数据
  const handleStaticIndicatorData = async (indicator) => {
    try {
      const resp = await getZhibiaoInfo(indicator)
      const dRaw = resp?.data ?? resp
      
      // 处理对象格式的数据
      let rows = []
      if (Array.isArray(dRaw)) {
        rows = dRaw
      } else if (typeof dRaw === 'object' && dRaw !== null) {
        rows = Object.entries(dRaw).map(([code, data]) => {
          if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
            return {
              '股票代码': code,
              '股票简称': `股票${code}`
            }
          }
          return {
            '股票代码': code,
            ...data
          }
        })
      }
      
      const processed = processStockData(rows, {})
      stockList.value = processed
      isThemeMode.value = false
      themeColumns.value = []
      // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
      dataColumns.value = processed.length > 0 ? orderColumns(Object.keys(processed[0])) : DEFAULT_CODE_COLUMNS
      showTimeFilter.value = false
      lastIndicatorSelected.value = indicator
      
      ElMessage.success(`搜索完成，搜索到${rows.length}支股票`)
    } catch (error) {
      stockList.value = []
      ElMessage.error('获取特色指标数据失败，请稍后重试')
    }
  }

  // 处理股票详情查看
  const handleViewDetail = (row) => {
    currentStock.value = row
    showStockDetail.value = true
  }

  // 处理股票代码点击
  const handleStockCodeClick = (stockCode) => {}

  // 分页处理
  const handlePageSizeChange = (newSize) => {
    pageSize.value = newSize
    currentPage.value = 1
  }

  const handleCurrentPageChange = (newPage) => {
    currentPage.value = newPage
  }

  // 表格排序
  const handleSortChange = ({ prop, order }) => {
    currentSort.prop = prop
    currentSort.order = order
    currentPage.value = 1
  }

  // 时间筛选变化：根据最近一次选择的特色指标重新生成静态数据
  const handleDateRangeChange = (newRange) => {
    dateRange.value = newRange
    if (lastIndicatorSelected.value) {
      handleStaticIndicatorData(lastIndicatorSelected.value)
    }
  }

  // 清理定时器
  onUnmounted(() => {
    if (autoTimer.value) {
      clearTimeout(autoTimer.value)
    }
    // 清理缓存
    queryCache.value.clear()
  })

  return {
    // 状态
    currentFilters,
    stockList,
    isThemeMode,
    themeColumns,
    dataColumns,
    searchLoading,
    showStockDetail,
    currentStock,
    showTimeFilter,
    dateRange,
    lastIndicatorSelected,
    currentPage,
    pageSize,
    tableRenderKey,
    tableRef,
    currentSort,
    
    // 计算属性
    paginatedStockList,
    
    // 方法
    handleFilterChange,
    handleSearch,
    handleViewDetail,
    handleStockCodeClick,
    handlePageSizeChange,
    handleCurrentPageChange,
    handleSortChange,
    handleDateRangeChange
  }

  // 组件卸载时清理缓存和定时器
  onUnmounted(() => {
    // 清理自动搜索定时器
    if (autoTimer.value) {
      clearTimeout(autoTimer.value)
    }
    
    // 清理查询缓存
    queryCache.value.clear()
    
    // 清理状态
    stockList.value = []
    themeColumns.value = []
    dataColumns.value = []
  })
}
