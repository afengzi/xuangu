/**
 * 股票数据格式化工具函数
 * 提供各种数据格式化方法，提高代码复用性
 */

/**
 * 获取价格颜色类名
 * @param {number} change - 价格变化值
 * @returns {string} CSS类名
 */
export const getPriceClass = (change) => {
  if (change > 0) return 'price-up'
  if (change < 0) return 'price-down'
  return 'price-neutral'
}

/**
 * 格式化价格显示
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的价格
 */
export const formatPrice = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  return `¥${value.toFixed(2)}`
}

/**
 * 格式化涨跌幅显示
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的涨跌幅
 */
export const formatChange = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  const formatted = value.toFixed(2)
  return value > 0 ? `+${formatted}` : formatted
}

/**
 * 格式化百分比显示
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的百分比
 */
export const formatPercent = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  const formatted = value.toFixed(2)
  return `${formatted}%`
}

/**
 * 格式化数值显示
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的数值
 */
export const formatNumber = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  return value.toFixed(2)
}

/**
 * 格式化金额显示
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的金额
 */
export const formatMoney = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  // 直接显示原始数值，单位为元
  return value.toFixed(2)
}

/**
 * 格式化亿元显示（净利润、营业收入、大单金额等）
 * @param {*} row - 表格行数据
 * @param {*} column - 表格列配置
 * @param {*} cellValue - 单元格值
 * @returns {string} 格式化后的亿元金额
 */
export const formatYiYuan = (row, column, cellValue) => {
  if (cellValue == null || cellValue === '') return '-'
  const value = Number(cellValue)
  if (isNaN(value)) return '-'
  // 转换为亿元并保留两位小数
  const yiYuan = value / 100000000
  return `${yiYuan.toFixed(2)}亿`
}

/**
 * 专门用于模板显示的涨跌幅格式化函数
 * @param {*} value - 涨跌幅值
 * @returns {string} 格式化后的涨跌幅
 */
export const formatChangeValue = (value) => {
  if (value == null || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  const formatted = num.toFixed(2)
  return num > 0 ? `+${formatted}` : formatted
}

/**
 * 专门用于模板显示的百分比格式化函数
 * @param {*} value - 百分比值
 * @returns {string} 格式化后的百分比
 */
export const formatPercentValue = (value) => {
  if (value == null || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  const formatted = num.toFixed(2)
  return num > 0 ? `+${formatted}%` : `${formatted}%`
}

/**
 * 获取统一的站点 Host（可由运行时 window.__STOCK_HOST 覆盖）
 */
export const getStockHost = () => {
  const mod = window.StockLinkFactory && window.StockLinkFactory()
  if (mod && typeof mod.getStockHost === 'function') return mod.getStockHost()
  return (window.__STOCK_HOST || 'http://192.168.1.25:3000')
}

/**
 * 统一格式化股票代码链接
 * 无论来自哪个页面/模式，链接一律为 {host}/code_{code}
 */
export const formatStockCodeLink = (stockCode) => {
  const mod = window.StockLinkFactory && window.StockLinkFactory()
  if (mod && typeof mod.formatStockCodeLink === 'function') return mod.formatStockCodeLink(stockCode)
  const host = getStockHost()
  return `${host}/code_${stockCode}`
}

/**
 * 统一的路由目标：/stock-filter?code={code}
 */
export const formatStockRoute = (stockCode) => ({ path: '/stock-filter', query: { code: stockCode } })

/**
 * 统一的路由 href 字符串（用于 a 标签展示一致的地址）
 */
export const formatStockRoutePath = (stockCode) => `/stock-filter?code=${encodeURIComponent(stockCode)}`

/**
 * 分析系统外链 Host（可运行时覆盖 window.__ANALYSIS_HOST）
 */
export const getAnalysisHost = () => (window.__ANALYSIS_HOST || 'http://192.168.1.188:8077')

/**
 * 统一生成分析系统的跳转链接 - 内存优化版本
 * 形如：http://host:port/analysis?stock_code=CODE
 */
const URL_CACHE = new Map()
export const formatStockAnalysisUrl = (stockCode) => {
  if (!stockCode) return '#'
  
  if (URL_CACHE.has(stockCode)) {
    return URL_CACHE.get(stockCode)
  }
  
  const host = getAnalysisHost()
  const url = `${host}/analysis?stock_code=${encodeURIComponent(stockCode)}`
  URL_CACHE.set(stockCode, url)
  return url
}

/**
 * 通达信内部专用链接格式 - 内存优化版本
 * 形如：http://www.treeid/code_股票代码
 */
const TREE_URL_CACHE = new Map()
export const formatTreeIdUrl = (stockCode) => {
  const mod = window.StockLinkFactory && window.StockLinkFactory()
  if (mod && typeof mod.formatTreeIdUrl === 'function') return mod.formatTreeIdUrl(stockCode)
  if (!stockCode) return '#'
  return `http://www.treeid/code_${stockCode}`
}

/**
 * 是否移动端
 */
export const isMobile = () => {
  const mod = window.StockLinkFactory && window.StockLinkFactory()
  if (mod && typeof mod.isMobile === 'function') return mod.isMobile()
  try {
    const ua = navigator.userAgent || ''
    return /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  } catch (_) { return false }
}

/**
 * 初始化通达信浏览器标记（与外部脚本示例保持一致）
 */
(() => {
  try {
    const ua = navigator.userAgent || ''
    const byUA = /TdxBrowser|TdxW|tdx|TongDaXin/i.test(ua)
    const byExternal = !!(window.external && (window.external.GetCookie || window.external.GetSecurityInfo))
    window.tdxBrowser = Boolean(byUA || byExternal)
  } catch (_) {
    window.tdxBrowser = false
  }
})()

/**
 * 处理股票代码点击事件
 * @param {string} stockCode - 股票代码
 */
export const handleStockCodeClick = (event, stockCode) => {
  const mod = window.StockLinkFactory && window.StockLinkFactory()
  if (mod && typeof mod.handleStockCodeClick === 'function') return mod.handleStockCodeClick(event, stockCode)
  return false
}

/**
 * 默认表格列配置
 */
export const DEFAULT_CODE_COLUMNS = [
  'code',
  '股票简称',
  '净利润',
  '营业收入',
  '销售毛利率',
  '资产负债率',
  'ROE',
  '市净率',
  '市盈率',
  '大单净量',
  '大单净额'
]
