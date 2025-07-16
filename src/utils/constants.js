// 筛选类别配置
export const FILTER_CATEGORIES = {
  indicator: { name: '指标', status: 'pending' },
  hotConcept: { name: '热门概念', status: 'pending' },
  fundamental: { name: '基本面', status: 'active' },
  technical: { name: '技术面', status: 'active' },
  capital: { name: '资金面', status: 'active' }
}

// 基本面筛选条件
export const FUNDAMENTAL_FILTERS = {
  revenue: { 
    name: '营业收入', 
    unit: '亿元', 
    ranges: ['5以下', '5~10', '10~20', '20~50', '50以上']
  },
  pe: { 
    name: '市盈率', 
    unit: '%', 
    ranges: ['10以下', '10~20', '20~30', '30~40']
  },
  grossMargin: { 
    name: '销售毛利率', 
    unit: '%', 
    ranges: ['5以下', '5~20', '20~35', '35~40', '40以上']
  },
  roe: { 
    name: 'ROE', 
    unit: '%', 
    ranges: ['5以下', '5~10', '10~20', '20以上']
  },
  netProfit: { 
    name: '净利润', 
    unit: '亿元', 
    ranges: ['亏损', '0~1', '1~3', '3~5', '5以上']
  },
  pb: { 
    name: '市净率', 
    unit: '%', 
    ranges: ['1以下', '1~1.5', '1.5~2', '2~3', '3以上']
  },
  debtRatio: { 
    name: '资产负债率', 
    unit: '%', 
    ranges: ['10以下', '10~15', '15~30', '30以上']
  }
}

// 技术面筛选条件
export const TECHNICAL_FILTERS = {
  macd: {
    name: 'MACD',
    ranges: ['金叉', '底背离', '拐头向上', '0轴金叉']
  },
  kdj: {
    name: 'KDJ',
    ranges: ['金叉', '底背离', '拐头向上']
  },
  boll: {
    name: 'BOLL',
    ranges: ['突破上轨', '突破下轨', '突破中轨', '开口向上']
  },
  kPattern: {
    name: '单k组合',
    ranges: ['大阳线', '小阳星', '向上跳空缺口', '向下跳空', '长下影线', '长上影线']
  },
  ma: {
    name: '均线',
    ranges: ['多头排列', '均线粘合', '股价站上5日线', '股价站上60日线']
  }
}

// 资金面筛选条件
export const CAPITAL_FILTERS = {
  bigOrderNet: {
    name: '大单净量',
    ranges: ['小于0', '0~1', '1~3', '大于3']
  },
  bigOrderAmount: {
    name: '大单金额',
    unit: '万元',
    ranges: ['小于0', '0~1000', '1000~5000', '大于5000']
  },
  hkConnect: {
    name: '陆股通净流入',
    unit: '万元',
    ranges: ['小于0', '0~1000', '1000~5000', '5000~10000', '大于10000']
  }
}

// 所有筛选条件映射
export const ALL_FILTERS = {
  fundamental: FUNDAMENTAL_FILTERS,
  technical: TECHNICAL_FILTERS,
  capital: CAPITAL_FILTERS
} 