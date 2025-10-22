(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.StockFilterCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // 将前端值格式转换为后端期望的格式
  function convertToBackendFormat(factorName, frontendValue) {
    // 基本面因子转换
    if (factorName === '营业收入') {
      if (frontendValue === '5以下') return '小于5亿';
      if (frontendValue === '5~10') return '5-10亿';
      if (frontendValue === '10~20') return '10-20亿';
      if (frontendValue === '20~50') return '20-50亿';
      if (frontendValue === '50以上') return '大于50亿';
    }
    
    if (factorName === '市盈率') {
      if (frontendValue === '10以下') return '小于10';
      if (frontendValue === '10~20') return '10-20';
      if (frontendValue === '20~30') return '20-30';
      if (frontendValue === '30~40') return '30-40';
    }
    
    if (factorName === '销售毛利率') {
      if (frontendValue === '5以下') return '小于5%';
      if (frontendValue === '5~20') return '5%-20%';
      if (frontendValue === '20~35') return '20%-35%';
      if (frontendValue === '35~40') return '35%-40%';
      if (frontendValue === '40以上') return '大于40%';
    }
    
    if (factorName === 'ROE') {
      if (frontendValue === '5以下') return '小于5%';
      if (frontendValue === '5~10') return '5%-10%';
      if (frontendValue === '10~20') return '10%-20%';
      if (frontendValue === '20以上') return '大于20%';
    }
    
    if (factorName === '净利润') {
      if (frontendValue === '亏损') return '小于0';
      if (frontendValue === '0~1') return '0-1亿';
      if (frontendValue === '1~3') return '1-3亿';
      if (frontendValue === '3~5') return '3-5亿';
      if (frontendValue === '5以上') return '大于5亿';
    }
    
    if (factorName === '市净率') {
      if (frontendValue === '1以下') return '小于1';
      if (frontendValue === '1~1.5') return '1-1.5';
      if (frontendValue === '1.5~2') return '1.5-2';
      if (frontendValue === '2~3') return '2-3';
      if (frontendValue === '3以上') return '大于3';
    }
    
    if (factorName === '资产负债率') {
      if (frontendValue === '10以下') return '小于10%';
      if (frontendValue === '10~15') return '10%-15%';
      if (frontendValue === '15~30') return '15%-30%';
      if (frontendValue === '30以上') return '大于30%';
    }
    
    // 技术面因子转换
    if (factorName === 'MACD') {
      if (frontendValue === '金叉') return 'MACD_金叉';
      if (frontendValue === '底背离') return 'MACD_底背离';
      if (frontendValue === '拐头向上') return 'MACD_拐头向上';
      if (frontendValue === '0轴金叉') return 'MACD_0轴金叉';
    }
    
    if (factorName === 'KDJ') {
      if (frontendValue === '金叉') return 'KDJ_金叉';
      if (frontendValue === '底背离') return 'KDJ_底背离';
      if (frontendValue === '拐头向上') return 'KDJ_拐头向上';
    }
    
    if (factorName === 'BOLL') {
      if (frontendValue === '突破上轨') return 'BOLL_突破上轨';
      if (frontendValue === '突破下轨') return 'BOLL_突破下轨';
      if (frontendValue === '突破中轨') return 'BOLL_突破中轨';
      if (frontendValue === '开口向上') return 'BOLL_开口向上';
    }
    
    if (factorName === '单k组合') {
      if (frontendValue === '大阳线') return '大阳线';
      if (frontendValue === '小阳星') return '小阳星';
      if (frontendValue === '向上跳空缺口') return '向上跳空缺口';
      if (frontendValue === '向下跳空') return '向下跳空';
      if (frontendValue === '长下影线') return '长下影线';
      if (frontendValue === '长上影线') return '长上影线';
    }
    
    if (factorName === '均线') {
      if (frontendValue === '多头排列') return '均线_多头排列';
      if (frontendValue === '均线粘合') return '均线_粘合';
      if (frontendValue === '股价站上5日线') return '股价站上5日线';
      if (frontendValue === '股价站上60日线') return '均线_股价站上60日线';
    }
    
    // 资金面因子转换
    if (factorName === '大单净量') {
      if (frontendValue === '小于0') return '小于0';
      if (frontendValue === '0~1') return '0-1';
      if (frontendValue === '1~3') return '1-3';
      if (frontendValue === '大于3') return '大于3';
    }
    
    if (factorName === '大单净额') {
      if (frontendValue === '小于0') return '小于0';
      if (frontendValue === '0~1000') return '0-1000万';
      if (frontendValue === '1000~5000') return '1000-5000万';
      if (frontendValue === '大于5000') return '大于5000万';
    }
    
    if (factorName === '陆股通净流入') {
      if (frontendValue === '小于0') return '小于0';
      if (frontendValue === '0~1000') return '0-1000万';
      if (frontendValue === '1000~5000') return '1000-5000万';
      if (frontendValue === '5000~10000') return '5000万-1亿';
      if (frontendValue === '大于10000') return '大于1亿';
    }
    
    // 默认返回原值
    return frontendValue;
  }

  var StockFilterCore = {
    // 收集所有筛选条件因子
    collectFactors: function(allFilters) {
      var factors = [];
      
      // 处理基本面因子
      if (allFilters.fundamental && typeof allFilters.fundamental === 'object') {
        Object.keys(allFilters.fundamental).forEach(function(key) {
          var value = allFilters.fundamental[key];
          if (value) {
            // 将英文键名转换为中文显示名
            var chineseName = window.FactorMapping && window.FactorMapping.ALL_FACTOR_MAPPING && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.fundamental && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.fundamental[key] || key;
            
            // 将前端值格式转换为后端期望的格式
            var backendValue = convertToBackendFormat(chineseName, value);
            factors.push(chineseName + '_' + backendValue);
          }
        });
      }
      
      // 处理技术面因子
      if (allFilters.technical && typeof allFilters.technical === 'object') {
        Object.keys(allFilters.technical).forEach(function(key) {
          var value = allFilters.technical[key];
          if (value) {
            // 将英文键名转换为中文显示名
            var chineseName = window.FactorMapping && window.FactorMapping.ALL_FACTOR_MAPPING && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.technical && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.technical[key] || key;
            
            // 将前端值格式转换为后端期望的格式
            var backendValue = convertToBackendFormat(chineseName, value);
            
            // 对于技术面因子，convertToBackendFormat已经返回了完整的因子名称
            if (backendValue && backendValue.includes('_')) {
              factors.push(backendValue);
            } else {
              factors.push(chineseName + '_' + backendValue);
            }
          }
        });
      }
      
      // 处理资金面因子
      if (allFilters.capital && typeof allFilters.capital === 'object') {
        Object.keys(allFilters.capital).forEach(function(key) {
          var value = allFilters.capital[key];
          if (value) {
            // 将英文键名转换为中文显示名
            var chineseName = window.FactorMapping && window.FactorMapping.ALL_FACTOR_MAPPING && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.capital && 
                            window.FactorMapping.ALL_FACTOR_MAPPING.capital[key] || key;
            
            // 将前端值格式转换为后端期望的格式
            var backendValue = convertToBackendFormat(chineseName, value);
            factors.push(chineseName + '_' + backendValue);
          }
        });
      }
      
      // 处理特色指标因子
      if (allFilters.indicator && allFilters.indicator.special) {
        factors.push(allFilters.indicator.special);
      }
      
      return { factors: factors };
    },
    
    // 处理股票数据，规范化返回格式
    processStockData: function(rows, options) {
      var result = [];
      var defaultOptions = {
        addCodePrefix: false,
        includeMetaData: false
      };
      options = Object.assign({}, defaultOptions, options);
      
      rows.forEach(function(row) {
        var processedRow = {};
        
        // 复制所有属性
        Object.keys(row).forEach(function(key) {
          var value = row[key];
          
          // 处理数值类型
          if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
            value = parseFloat(value);
          }
          
          processedRow[key] = value;
        });
        
        // 处理股票代码
        if (options.addCodePrefix && processedRow['股票代码']) {
          var code = String(processedRow['股票代码']);
          if (code.length === 6) {
            // 沪市代码以6开头，深市代码以0或3开头
            var prefix = code.startsWith('6') ? 'SH' : 'SZ';
            processedRow['股票代码'] = prefix + code;
          }
        }
        
        // 添加元数据（如果需要）
        if (options.includeMetaData) {
          processedRow['_meta'] = {
            timestamp: Date.now(),
            source: 'api'
          };
        }
        
        result.push(processedRow);
      });
      
      return result;
    },
    
    // 验证因子配置
    validateFactorConfig: function(factorConfig) {
      var errors = [];
      
      // 验证必需的字段
      if (!factorConfig) {
        errors.push('因子配置对象不能为空');
        return { valid: false, errors: errors };
      }
      
      // 验证INDICATOR_OPTIONS
      if (!Array.isArray(factorConfig.INDICATOR_OPTIONS)) {
        errors.push('INDICATOR_OPTIONS 必须是数组类型');
      }
      
      // 验证FACTOR_CATEGORIES
      if (!factorConfig.FACTOR_CATEGORIES || typeof factorConfig.FACTOR_CATEGORIES !== 'object') {
        errors.push('FACTOR_CATEGORIES 必须是对象类型');
      } else {
        ['fundamental', 'technical', 'capital'].forEach(function(category) {
          if (!Array.isArray(factorConfig.FACTOR_CATEGORIES[category])) {
            errors.push(category + ' 必须是数组类型');
          }
        });
      }
      
      // 验证FACTOR_RANGES
      if (!factorConfig.FACTOR_RANGES || typeof factorConfig.FACTOR_RANGES !== 'object') {
        errors.push('FACTOR_RANGES 必须是对象类型');
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
    },
    
    // 格式化因子值为显示文本
    formatFactorValue: function(factorName, value) {
      var formatMap = {
        '市盈率(TTM)': function(v) {
          if (v < 0) return '负';
          if (v < 10) return '<10';
          if (v < 20) return '10-20';
          if (v < 30) return '20-30';
          return '>30';
        },
        '市净率': function(v) {
          if (v < 0) return '负';
          if (v < 1) return '<1';
          if (v < 2) return '1-2';
          if (v < 3) return '2-3';
          return '>3';
        },
        '毛利率': function(v) {
          if (v < 0) return '负';
          if (v < 10) return '<10%';
          if (v < 20) return '10-20%';
          if (v < 30) return '20-30%';
          return '>30%';
        },
        '净利率': function(v) {
          if (v < 0) return '负';
          if (v < 5) return '<5%';
          if (v < 10) return '5-10%';
          if (v < 15) return '10-15%';
          return '>15%';
        },
        'ROE': function(v) {
          if (v < 0) return '负';
          if (v < 5) return '<5%';
          if (v < 10) return '5-10%';
          if (v < 15) return '10-15%';
          return '>15%';
        },
        '营业收入增长率': function(v) {
          if (v < 0) return '负';
          if (v < 10) return '<10%';
          if (v < 20) return '10-20%';
          if (v < 30) return '20-30%';
          return '>30%';
        },
        '净利润增长率': function(v) {
          if (v < 0) return '负';
          if (v < 10) return '<10%';
          if (v < 20) return '10-20%';
          if (v < 30) return '20-30%';
          return '>30%';
        }
      };
      
      var formatter = formatMap[factorName];
      if (formatter) {
        return formatter(value);
      }
      
      // 默认格式化
      if (typeof value === 'number') {
        return value.toFixed(2);
      }
      return String(value);
    },
    
    // 生成默认的空配置
    createEmptyConfig: function() {
      return {
        INDICATOR_OPTIONS: [],
        FACTOR_CATEGORIES: {
          fundamental: [],
          technical: [],
          capital: []
        },
        FACTOR_RANGES: {}
      };
    }
  };
  
  // 工厂函数，兼容window.StockFilterFactory()调用方式
  StockFilterCore.factory = function() {
    return {
      collectFactors: StockFilterCore.collectFactors,
      processStockData: StockFilterCore.processStockData,
      validateFactorConfig: StockFilterCore.validateFactorConfig,
      formatFactorValue: StockFilterCore.formatFactorValue
    };
  };
  
  // 为了兼容，也暴露工厂函数到window上
  if (typeof window !== 'undefined') {
    window.StockFilterFactory = StockFilterCore.factory;
  }
  
  return StockFilterCore;
}));


