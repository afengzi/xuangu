/**
 * 股票筛选业务逻辑工具函数
 * 提供筛选条件处理、数据转换等业务逻辑
 */

// 从全局变量读取共享映射（与 legacy 共用 UMD 版本）
const FM = (typeof window !== 'undefined' && window.FactorMapping) ? window.FactorMapping : {}
const FUNDAMENTAL_NAME_MAP = FM.FUNDAMENTAL_NAME_MAP || {}
const TECHNICAL_NAME_MAP = FM.TECHNICAL_NAME_MAP || {}
const CAPITAL_NAME_MAP = FM.CAPITAL_NAME_MAP || {}

/**
 * 收集筛选因子，按后端约定命名
 * @param {Object} all - 所有筛选条件
 * @returns {Object} 包含因子数组和选择的因子信息
 */
export const collectFactors = (all) => {
  const out = []
  const selectedFactors = {
    fundamental: [],
    technical: [],
    capital: []
  }
  let indicatorSpecial = ''
  
  // 基本面：直接映射为"中文指标名_范围"
  const f = all?.fundamental || {}
  const fundamentalNameMap = FUNDAMENTAL_NAME_MAP
  
  // 统一区间/阈值文案：X以上 -> 大于X；X以下 -> 小于X；X~Y -> X~Y
  // 当 addYi=true（营业收入/净利润）时，在数值后追加"亿"
  const formatRange = (text, addYi = false) => {
    if (typeof text !== 'string') return text
    const unit = addYi ? '亿' : ''
    const gt = text.match(/^(\d+(?:\.\d+)?)以上$/)
    if (gt) return `大于${gt[1]}${unit}`
    const lt = text.match(/^(\d+(?:\.\d+)?)以下$/)
    if (lt) return `小于${lt[1]}${unit}`
    const between = text.match(/^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)$/)
    // 区间格式：营业收入/净利润采用 "起~止亿" 结构（仅在末尾加"亿"）；其它保持 ~
    if (between) return addYi
      ? `${between[1]}~${between[2]}${unit}`
      : `${between[1]}~${between[2]}`
    return /\d/.test(text) ? `${text}${unit}` : text
  }

  Object.keys(fundamentalNameMap).forEach(key => {
    const val = f[key]
    if (!val) return
    const metric = fundamentalNameMap[key]
    const addYi = (key === 'revenue' || key === 'netProfit')
    const normalized = formatRange(val, addYi)
    out.push(`${metric}_${normalized}`)
    selectedFactors.fundamental.push(metric)
  })

  // 特色指标：独立收集，不并入因子
  const ind = all?.indicator || {}
  if (ind.special) {
    indicatorSpecial = ind.special
  }
  
  // 技术面指标
  const t = all?.technical || {}
  if (t.macd) {
    out.push(`MACD_${t.macd}`)
    selectedFactors.technical.push('MACD')
  }
  if (t.kdj) {
    out.push(`KDJ_${t.kdj}`)
    selectedFactors.technical.push('KDJ')
  }
  if (t.boll) {
    out.push(`BOLL_${t.boll}`)
    selectedFactors.technical.push('BOLL')
  }
  if (t.kPattern) {
    out.push(`单k组合_${t.kPattern}`)
    selectedFactors.technical.push('单k组合')
  }
  if (t.ma) {
    if (t.ma === '多头排列') {
      out.push('均线_多头排列')
      selectedFactors.technical.push('均线')
    }
    if (t.ma === '均线粘合') {
      out.push('均线_粘合')
      selectedFactors.technical.push('均线')
    }
    if (t.ma === '股价站上5日线') {
      out.push('股价站上5日线')
      selectedFactors.technical.push('均线')
    }
    if (t.ma === '股价站上60日线') {
      out.push('均线_股价站上60日线')
      selectedFactors.technical.push('均线')
    }
  }

  // 资金面：拼接为"指标_范围"，金额类自动补"万"
  const c = all?.capital || {}
  const nameMap = CAPITAL_NAME_MAP
  Object.keys(nameMap).forEach(key => {
    const val = c[key]
    if (!val) return
    const metric = nameMap[key]
    let withUnit = val
    // 陆股通净流入：数值类补"万"
    if (key === 'hkConnect') {
      withUnit = /\d/.test(val) ? `${val}万` : val
    }
    // 大单净额：不追加"万"，并移除结尾可能存在的"万"
    if (key === 'bigOrderAmount') {
      withUnit = String(val).replace(/万$/,'')
    }
    out.push(`${metric}_${withUnit}`)
    selectedFactors.capital.push(metric)
  })

  // 处理题材选择
  const themes = all?.hotConcept?.themes || []
  
  return {
    factors: out,
    selectedFactors,
    themes: themes,
    indicator: indicatorSpecial
  }
}

/**
 * 处理股票数据映射，统一字段格式
 * @param {Array} rows - 原始股票数据
 * @param {Object} selectedFactors - 选择的因子信息
 * @returns {Array} 处理后的股票数据
 */
export const processStockData = (rows, selectedFactors = {}) => {
  if (!Array.isArray(rows)) return []
  
  return rows.map(x => {
    const out = { '股票代码': x.code || x['股票代码'] || '', ...x }
    // 删除不需要的字段
    delete out.con_code
    delete out.code  // 删除原始的code字段，只保留股票代码
    return out
  })
}


/**
 * 处理筛选条件变化的核心逻辑
 * @param {Object} filterData - 筛选数据
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果
 */
export const processFilterChange = (filterData, options = {}) => {
  const {
    isThemeMode = false,
    themeColumns = [],
    dataColumns = [],
    DEFAULT_CODE_COLUMNS = []
  } = options

  // 题材选择：允许触发搜索，以便计算因子和题材的交集
  // 注释掉原来的拦截逻辑，让题材选择也能触发搜索
  
  // 特色指标处理：仅选指标时走静态；与题材/因子组合时走常规搜索
  if (filterData?.category === 'indicator' && filterData?.condition === 'special') {
    const selected = filterData?.value
    const all = filterData?.allFilters || {}
    if (!selected) {
      // 取消选择：清空结果
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
        // 不返回任何列，避免静态表头
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


