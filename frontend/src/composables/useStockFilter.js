/**
 * 股票筛选业务逻辑组合式函数
 * 提供股票筛选相关的状态管理和业务逻辑
 */

import { ref, reactive, computed, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getStocksByFactorsSelection, getMultiThemeAndFactorInfo, getThemesInfo, getZhibiaoInfo, getCombinedFilterInfo } from '../api/stockAPI.js'
// 导入股票详情缓存，用于在筛选条件变化时清除
import { useStockTable } from '../components/common/StockTable/StockTable.js'
// 统一复用 shared 核心
const StockFilter = (typeof window !== 'undefined' && window.StockFilterFactory) ? window.StockFilterFactory() : null
const collectFactors = (all = {}) => {
  try {
    // 添加详细的调试日志，记录输入数据的结构
    console.log('collectFactors输入:', JSON.stringify(all, null, 2));
    
    // 首先尝试从window.StockFilter获取数据
    if (StockFilter && typeof StockFilter.collectFactors === 'function') {
      console.log('使用外部StockFilter.collectFactors');
      const result = StockFilter.collectFactors(all);
      
      // 验证并确保返回的数据结构完整
      if (result && typeof result === 'object') {
        console.log('StockFilter.collectFactors返回:', result);
        return {
          factors: Array.isArray(result.factors) ? result.factors : [],
          selectedFactors: result.selectedFactors || { fundamental: [], technical: [], capital: [] },
          themes: Array.isArray(result.themes) ? result.themes : (Array.isArray(all?.hotConcept?.themes) ? all.hotConcept.themes : []),
          indicator: result.indicator || all?.indicator?.special || ''
        };
      }
    }
    
    // 兜底：最小实现，但增强指标值的提取逻辑
    // 尝试从多个可能的位置提取指标值
    let indicator = '';
    if (all?.indicator?.special) {
      indicator = all.indicator.special;
    } else if (all?.indicator) {
      indicator = all.indicator;
    }
    
    // 从热门概念中提取题材
    const themes = Array.isArray(all?.hotConcept?.themes) ? all.hotConcept.themes : [];
    
    console.log('collectFactors兜底实现 - 提取的指标:', indicator, '题材:', themes);
    
    return {
      factors: [],
      selectedFactors: { fundamental: [], technical: [], capital: [] },
      themes: themes,
      indicator: indicator
    }
  } catch (error) {
    console.error('collectFactors函数执行出错:', error);
    // 出错时返回安全的默认值
    return {
      factors: [],
      selectedFactors: { fundamental: [], technical: [], capital: [] },
      themes: [],
      indicator: ''
    }
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
  // 在setup阶段调用useStockTable，而不是在方法内部
  let stockTable = null;
  try {
    stockTable = useStockTable();
  } catch (error) {
    console.warn('初始化股票表格工具失败:', error);
  }

  // 响应式状态
  const currentFilters = reactive({})
  const stockList = ref([])
  const isThemeMode = ref(false)
  const themeColumns = ref([])
  const dataColumns = ref([])
  const searchLoading = ref(false)
  const showStockDetail = ref(false)
  const currentStock = ref(null)
  const showTimeFilter = ref(false)
  const dateRange = ref([])
  const lastIndicatorSelected = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const tableRenderKey = ref(0)
  const tableRef = ref(null)
  const currentSort = reactive({ prop: null, order: null })
  const queryCache = ref(new Map())
  const autoTimer = ref(null)
  
  // 缓存机制
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
        
        // 处理空值
        if (av === null || av === undefined) return factor
        if (bv === null || bv === undefined) return -factor
        
        // 数字排序（包括字符串类型的数字）
        const aNum = parseFloat(av)
        const bNum = parseFloat(bv)
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return (aNum - bNum) * factor
        }
        
        // 字符串排序
        return String(av).localeCompare(String(bv)) * factor
      })
    }

    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return list.slice(start, end)
  })


  // 处理筛选条件变化
  const handleFilterChange = (filterData) => {
    // 清除股票详情缓存，确保在筛选条件变化后能获取最新的详情数据
    try {
      // 注意：不要在函数内部直接调用useStockTable()，因为它包含生命周期钩子
      // 生命周期钩子只能在setup阶段调用
      if (window.stockTooltipCache && typeof window.stockTooltipCache.clear === 'function') {
        window.stockTooltipCache.clear();
      } else if (stockTable && stockTable.tooltipCache && typeof stockTable.tooltipCache.value.clear === 'function') {
        stockTable.tooltipCache.value.clear();
      }
    } catch (error) {
      console.warn('清除股票详情缓存时出错:', error);
    }

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
    
    // 在try-catch外部定义这些变量，确保在catch块中也能访问
    let factors = []
    let selectedFactors = { fundamental: [], technical: [], capital: [] }
    let themes = []
    let indicator = ''
    
    try {
      // 调用collectFactors获取筛选数据
      const result = collectFactors(filters);
      
      // 确保result是对象
      const safeResult = result && typeof result === 'object' ? result : {};
      
      // 提取数据并提供安全的默认值
      factors = Array.isArray(safeResult.factors) ? safeResult.factors : []
      selectedFactors = safeResult.selectedFactors || { fundamental: [], technical: [], capital: [] }
      themes = Array.isArray(safeResult.themes) ? safeResult.themes : []
      indicator = safeResult.indicator || ''
      
      // 添加调试日志
      console.log('handleSearch - 提取的筛选条件:', {
        factors: factors.length,
        themes: themes.length,
        indicator: indicator
      });
      
      // 如果没有任何筛选条件，清空结果并返回
      if (factors.length === 0 && themes.length === 0 && !indicator) {
        console.log('handleSearch - 没有筛选条件，返回空结果');
        stockList.value = []
        isThemeMode.value = false
        themeColumns.value = []
        dataColumns.value = []
        searchLoading.value = false
        return
      }

      let cacheKey, resp
      // 确保themes和factors是数组，防止访问length属性时出错
      const safeThemes = Array.isArray(themes) ? themes : [];
      const safeFactors = Array.isArray(factors) ? factors : [];
      
      if ((safeThemes.length > 0 || safeFactors.length > 0) && indicator) {
        cacheKey = getCacheKey('themes_factors_zhibiao', { themes: safeThemes, factors: safeFactors, zhibiao: indicator })
        resp = getFromCache(cacheKey)
        if (!resp) {
          try {
            // 确保传递正确的值，注意虽然变量名是indicator，但getCombinedFilterInfo函数现在使用zhibiao作为第三个参数名
            // 这将确保后端API接收到正确的参数名zhibiao
            console.log('调用getCombinedFilterInfo，参数:', { safeThemes, safeFactors, zhibiao: indicator });
            resp = await getCombinedFilterInfo(safeThemes, safeFactors, indicator)
            setCache(cacheKey, resp)
          } catch (error) {
            console.error('组合筛选API调用失败:', error)
            console.error('API调用参数:', { safeThemes, safeFactors, zhibiao: indicator })
            // 抛出错误以便上层函数能够捕获并显示合适的错误消息
            throw new Error(`搜索失败: ${error.message || '未知错误'}`)
          }
        }
      } else if (safeThemes.length > 0 && safeFactors.length > 0) {
        cacheKey = getCacheKey('multi_theme_factor', { themes: safeThemes, factors: safeFactors })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getMultiThemeAndFactorInfo(safeThemes, safeFactors)
          setCache(cacheKey, resp)
        }
      } else if (safeThemes.length > 0) {
        cacheKey = getCacheKey('themes', { themes: safeThemes })
        resp = getFromCache(cacheKey)
        if (!resp) {
          resp = await getThemesInfo(safeThemes)
          setCache(cacheKey, resp)
        }
      } else if (safeFactors.length > 0) {
        cacheKey = getCacheKey('factors', { factors: safeFactors })
        resp = getFromCache(cacheKey)
        if (!resp) {
          try {
            console.log('调用getStocksByFactorsSelection，参数数量:', safeFactors.length);
            resp = await getStocksByFactorsSelection(safeFactors)
            setCache(cacheKey, resp)
          } catch (error) {
            console.error('因子筛选API调用失败:', error)
            console.error('API调用参数数量:', safeFactors.length)
            throw new Error(`搜索失败: ${error.message || '未知错误'}`)
          }
        }
      } else if (indicator) {
        // 防御：若只有指标仍走到这里，退回静态接口
        resp = await getZhibiaoInfo(indicator)
      }

      // 增强的响应数据处理，兼容多种可能的响应格式
      const dRaw = resp?.data ?? resp
      let d = [] // 默认空数组
      
      console.log('原始API响应数据:', dRaw)
      
      // 尝试多种可能的数据格式
      if (Array.isArray(dRaw)) {
        d = dRaw
      } else if (Array.isArray(dRaw?.stocks)) {
        d = dRaw.stocks
      } else if (Array.isArray(dRaw?.data)) {
        d = dRaw.data
      } else if (typeof dRaw === 'object' && dRaw !== null) {
        // 处理对象格式：将对象转换为数组
        const entries = Object.entries(dRaw)
        if (entries.length > 0) {
          d = entries.map(([code, data]) => {
            // 检查data是否为有效的股票数据对象
            if (typeof data === 'object' && data !== null) {
              return {
                '股票代码': code,
                '股票简称': data.name || data['股票简称'] || `股票${code}`,
                ...data
              }
            } else if (typeof code === 'string' && /^\d{6}$/.test(code)) {
              // 如果键看起来像股票代码但值不是对象，创建基本对象
              return {
                '股票代码': code,
                '股票简称': `股票${code}`
              }
            }
            return null
          }).filter(Boolean) // 过滤掉null值
        }
      }
      
      console.log('处理后的股票数据:', d)

      const rows = Array.isArray(d) ? d : []
      
      // 确保rows是数组
      const safeRows = Array.isArray(rows) ? rows : [];
      
      if (safeThemes.length > 0 || (safeThemes.length > 0 && safeFactors.length > 0)) {
        // 题材模式
        const processed = processStockData(safeRows, selectedFactors)
        stockList.value = processed
        isThemeMode.value = true
        // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
        themeColumns.value = processed && processed.length > 0 ? orderColumns(Object.keys(processed[0])) : []
        dataColumns.value = []
        showTimeFilter.value = true
      } else {
        // 常规模式
        const processed = processStockData(safeRows, selectedFactors)
        stockList.value = processed
        isThemeMode.value = false
        themeColumns.value = []
        // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
        dataColumns.value = processed && processed.length > 0 ? orderColumns(Object.keys(processed[0])) : DEFAULT_CODE_COLUMNS
        showTimeFilter.value = false
      }
      
      if (!silent) {
        safeRows.length ? ElMessage.success(`搜索完成，搜索到${safeRows.length}支股票`) : ElMessage.info('未找到符合条件的股票')
      }
    } catch (error) {
      stockList.value = []
      console.error('搜索股票时发生错误:', error)
      // 确保在catch块中也能安全访问这些变量
      console.error('搜索参数:', { themes: safeThemes, factors: safeFactors, indicator })
      if (!silent) ElMessage.error('搜索失败，请稍后重试')
    } finally {
      searchLoading.value = false
    }
  }

  // 处理静态指标数据
  const handleStaticIndicatorData = async (indicator) => {
    try {
      // 注意：虽然变量名是indicator，但getZhibiaoInfo函数内部会将其作为zhibiao参数传递给后端API
      console.log('调用getZhibiaoInfo，参数值:', indicator)
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
      
      console.log('getZhibiaoInfo返回数据处理后:', rows.length, '条股票数据')
      
      const processed = processStockData(rows, {})
      stockList.value = processed
      isThemeMode.value = false
      themeColumns.value = []
      // 固定列顺序：股票代码、股票简称在前，其他列按原始顺序
      dataColumns.value = processed && processed.length > 0 ? orderColumns(Object.keys(processed[0])) : DEFAULT_CODE_COLUMNS
      showTimeFilter.value = false
      lastIndicatorSelected.value = indicator
      
      ElMessage.success(`搜索完成，搜索到${rows.length}支股票`)
    } catch (error) {
      console.error('获取特色指标数据失败:', error)
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
}