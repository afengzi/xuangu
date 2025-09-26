/**
 * 因子中英文键名映射常量
 * 用于 legacy 页面与主站之间的数据转换
 * 兼容 ES6 模块和 IE11 全局变量两种使用方式
 */

// 基本面因子映射：英文键名 -> 中文显示名
var FUNDAMENTAL_NAME_MAP = {
  revenue: '营业收入',
  pe: '市盈率',
  grossMargin: '销售毛利率',
  roe: 'ROE',
  netProfit: '净利润',
  pb: '市净率',
  debtRatio: '资产负债率'
}

// 技术面因子映射：英文键名 -> 中文显示名
var TECHNICAL_NAME_MAP = {
  macd: 'MACD',
  kdj: 'KDJ',
  boll: 'BOLL',
  kPattern: '单k组合',
  ma: '均线'
}

// 资金面因子映射：英文键名 -> 中文显示名
var CAPITAL_NAME_MAP = {
  bigOrderNet: '大单净量',
  bigOrderAmount: '大单净额',
  hkConnect: '陆股通净流入'
}

// 反向映射：中文显示名 -> 英文键名（用于 legacy 页面）
var CHINESE_TO_ENGLISH_MAP = {
  // 基本面
  '营业收入': 'revenue',
  '市盈率': 'pe',
  '销售毛利率': 'grossMargin',
  'ROE': 'roe',
  '净利润': 'netProfit',
  '市净率': 'pb',
  '资产负债率': 'debtRatio',
  // 技术面
  'MACD': 'macd',
  'KDJ': 'kdj',
  'BOLL': 'boll',
  '单k组合': 'kPattern',
  '均线': 'ma',
  // 资金面
  '大单净量': 'bigOrderNet',
  '大单净额': 'bigOrderAmount',
  '陆股通净流入': 'hkConnect'
}

// 合并所有映射
var ALL_FACTOR_MAPPING = {
  fundamental: FUNDAMENTAL_NAME_MAP,
  technical: TECHNICAL_NAME_MAP,
  capital: CAPITAL_NAME_MAP,
  chineseToEnglish: CHINESE_TO_ENGLISH_MAP
}

// 导出为全局变量，供 legacy 页面使用（IE11 兼容）
if (typeof window !== 'undefined') {
  window.FactorMapping = {
    FUNDAMENTAL_NAME_MAP: FUNDAMENTAL_NAME_MAP,
    TECHNICAL_NAME_MAP: TECHNICAL_NAME_MAP,
    CAPITAL_NAME_MAP: CAPITAL_NAME_MAP,
    CHINESE_TO_ENGLISH_MAP: CHINESE_TO_ENGLISH_MAP,
    ALL_FACTOR_MAPPING: ALL_FACTOR_MAPPING
  }
}

// ES6 模块导出（现代浏览器）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FUNDAMENTAL_NAME_MAP,
    TECHNICAL_NAME_MAP,
    CAPITAL_NAME_MAP,
    CHINESE_TO_ENGLISH_MAP,
    ALL_FACTOR_MAPPING
  }
}

// ES6 export（现代浏览器）
if (typeof exports !== 'undefined') {
  exports.FUNDAMENTAL_NAME_MAP = FUNDAMENTAL_NAME_MAP
  exports.TECHNICAL_NAME_MAP = TECHNICAL_NAME_MAP
  exports.CAPITAL_NAME_MAP = CAPITAL_NAME_MAP
  exports.CHINESE_TO_ENGLISH_MAP = CHINESE_TO_ENGLISH_MAP
  exports.ALL_FACTOR_MAPPING = ALL_FACTOR_MAPPING
}
