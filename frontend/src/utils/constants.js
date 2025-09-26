// 读取共享配置（通过全局变量，兼容 legacy 与主站共存）
const FC = (typeof window !== 'undefined' && window.FactorConfig) ? window.FactorConfig : {}
const INDICATOR_OPTIONS = FC.INDICATOR_OPTIONS || []
const FACTOR_CATEGORIES = FC.FACTOR_CATEGORIES || { fundamental: [], technical: [], capital: [] }
const FACTOR_RANGES = FC.FACTOR_RANGES || {}

// 筛选类别配置
export const FILTER_CATEGORIES = {
  indicator: { name: '特色指标', status: 'active' },
  hotConcept: { name: '热门概念', status: 'active' },
  fundamental: { name: '基本面', status: 'active' },
  technical: { name: '技术面', status: 'active' },
  capital: { name: '资金面', status: 'active' }
}

// 特色指标（使用共享配置）
export const INDICATOR_FILTERS = {
  special: {
    name: '特色指标',
    ranges: INDICATOR_OPTIONS
  }
}

// 基本面筛选条件（使用共享配置）
export const FUNDAMENTAL_FILTERS = {
  revenue: { 
    name: '营业收入', 
    type: 'range',
    ranges: FACTOR_RANGES['营业收入']
  },
  pe: { 
    name: '市盈率', 
    type: 'range', 
    ranges: FACTOR_RANGES['市盈率']
  },
  grossMargin: { 
    name: '销售毛利率', 
    type: 'range',
    ranges: FACTOR_RANGES['销售毛利率']
  },
  roe: { 
    name: 'ROE', 
    type: 'range',
    ranges: FACTOR_RANGES['ROE']
  },
  netProfit: { 
    name: '净利润', 
    type: 'range',
    ranges: FACTOR_RANGES['净利润']
  },
  pb: { 
    name: '市净率', 
    type: 'range',
    ranges: FACTOR_RANGES['市净率']
  },
  debtRatio: { 
    name: '资产负债率', 
    type: 'range',
    ranges: FACTOR_RANGES['资产负债率']
  }
}

// 技术面筛选条件（使用共享配置）
export const TECHNICAL_FILTERS = {
  macd: {
    name: 'MACD',
    ranges: FACTOR_RANGES['MACD']
  },
  kdj: {
    name: 'KDJ',
    ranges: FACTOR_RANGES['KDJ']
  },
  boll: {
    name: 'BOLL',
    ranges: FACTOR_RANGES['BOLL']
  },
  kPattern: {
    name: '单k组合',
    ranges: FACTOR_RANGES['单k组合']
  },
  ma: {
    name: '均线',
    ranges: FACTOR_RANGES['均线']
  }
}

// 资金面筛选条件（使用共享配置）
export const CAPITAL_FILTERS = {
  bigOrderNet: {
    name: '大单净量',
    ranges: FACTOR_RANGES['大单净量']
  },
  bigOrderAmount: {
    name: '大单净额',
    unit: '万元',
    ranges: FACTOR_RANGES['大单净额']
  },
  hkConnect: {
    name: '陆股通净流入',
    unit: '万元',
    ranges: FACTOR_RANGES['陆股通净流入']
  }
}

// 所有筛选条件映射
export const ALL_FILTERS = {
  indicator: INDICATOR_FILTERS,
  fundamental: FUNDAMENTAL_FILTERS,
  technical: TECHNICAL_FILTERS,
  capital: CAPITAL_FILTERS
} 