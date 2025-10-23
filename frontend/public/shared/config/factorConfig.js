/**
 * 全局因子配置（UMD 风格）
 * 供主站和 Legacy 页面共同使用
 */

// 特色指标选项
var INDICATOR_OPTIONS = ['打板','抄底','低吸','追涨','龙头'];

// 因子分类配置
var FACTOR_CATEGORIES = {
  fundamental: ['营业收入','市盈率','销售毛利率','ROE','净利润','市净率','资产负债率'],
  technical: ['MACD','KDJ','BOLL','单k组合','均线'],
  capital: ['大单净量','大单净额','陆股通净流入']
};

// 因子范围配置
var FACTOR_RANGES = {
  '营业收入': ['小于5亿','5~10亿','10~20亿','20~50亿','50亿以上'],
  '市盈率': ['10以下','10~20','20~30','30~40'],
  '销售毛利率': ['5以下','5~20','20~35','35~40','40以上'],
  'ROE': ['5以下','5~10','10~20','20以上'],
  '净利润': ['亏损','0~1亿','1~3亿','3~5亿','5亿以上'],
  '市净率': ['1以下','1~1.5','1.5~2','2~3','3以上'],
  '资产负债率': ['10以下','10~15','15~30','30以上'],
  'MACD': ['金叉','底背离','拐头向上','0轴金叉'],
  'KDJ': ['金叉','底背离','拐头向上'],
  'BOLL': ['突破上轨','突破下轨','突破中轨','开口向上'],
  '单k组合': ['大阳线','小阳星','向上跳空缺口','向下跳空','长下影线','长上影线'],
  '均线': ['多头排列','均线粘合','股价站上5日线','股价站上60日线'],
  '大单净量': ['小于0','0~1','1~3','大于3'],
  '大单净额': ['小于0','0~1000万','1000~5000万','大于5000万'],
  '陆股通净流入': ['小于0','0~1000万','1000~5000万','5000~10000万','10000万以上']
};

// 暴露到全局变量（浏览器）
if (typeof window !== 'undefined') {
  window.FactorConfig = {
    INDICATOR_OPTIONS: INDICATOR_OPTIONS,
    FACTOR_CATEGORIES: FACTOR_CATEGORIES,
    FACTOR_RANGES: FACTOR_RANGES
  };
}

// CommonJS 导出（Node.js / 打包器环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    INDICATOR_OPTIONS: INDICATOR_OPTIONS,
    FACTOR_CATEGORIES: FACTOR_CATEGORIES,
    FACTOR_RANGES: FACTOR_RANGES
  };
}