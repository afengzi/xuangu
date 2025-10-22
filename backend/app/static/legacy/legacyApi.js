/**
 * Legacy API 适配层 直接调用 web/src 下已实现的代码
 * 为 IE 兼容页面提供与主站一致的 API 调用方式
 */

// 模拟 ES6 模块导入（IE11 兼容）
(function() {
  'use strict';
  
  // 确保 FactorMapping 可用
  if (typeof window.FactorMapping === 'undefined') {
    console.warn('FactorMapping 未定义，创建默认对象');
    window.FactorMapping = {
      FUNDAMENTAL_NAME_MAP: {},
      TECHNICAL_NAME_MAP: {},
      CAPITAL_NAME_MAP: {},
      CHINESE_TO_ENGLISH_MAP: {}
    };
  }
  
  // 全局 API 对象
  window.LegacyAPI = {
    // 基础配置 - 使用相对路径，自动适配当前域名和端口
    API_BASE: '/api',
    
    // 认证头
    getAuthHeaders: function() {
      var headers = { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };
      try {
        // 统一使用admin_token键名
        var token = localStorage.getItem('admin_token');
        if (token) headers['Authorization'] = 'Bearer ' + token;
      } catch (e) {}
      return headers;
    },
    
    // 通用请求方法（模拟 axios 行为）
    request: function(method, url, data, options) {
      var config = {
        method: method.toUpperCase(),
        mode: 'cors',
        credentials: 'omit',
        headers: this.getAuthHeaders()
      };
      
      if (method.toLowerCase() === 'get') {
        var qs = data ? '?' + Object.keys(data).map(function(k){
          return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
        }).join('&') : '';
        url = this.API_BASE + url + qs;
      } else {
        url = this.API_BASE + url;
        config.body = JSON.stringify(data || {});
      }
      
      return fetch(url, config)
        .then(function(response) {
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          var contentType = response.headers.get('content-type') || '';
          if (contentType.indexOf('application/json') > -1) {
            return response.json();
          }
          return response.text().then(function(text) {
            throw new Error('非JSON响应: ' + text.slice(0, 120));
          });
        });
    },
    
    // GET 请求
    get: function(url, params, options) {
      return this.request('get', url, params, options);
    },
    
    // POST 请求
    post: function(url, data, options) {
      return this.request('post', url, data, options);
    },
    
    // 股票筛选 API（直接对应 web/src/api/stockAPI.js）
    stockAPI: {
      // 获取所有题材列表
      getAllThemes: function() {
        return window.LegacyAPI.get('/theme/list');
      },
      
      // 题材筛选
      getThemesInfo: function(themes) {
        return window.LegacyAPI.post('/stock/filter/themes', { themes: themes });
      },
      
      // 因子筛选
      getStocksByFactorsSelection: function(factors) {
        return window.LegacyAPI.post('/stock/filter/factors', { factors: factors });
      },
      
      // 题材和因子筛选
      getMultiThemeAndFactorInfo: function(themes, factors) {
        return window.LegacyAPI.post('/stock/filter/themes-and-factors', { 
          themes: themes, 
          factors: factors 
        });
      },
      
      // 特色指标查询
      getZhibiaoInfo: function(zhibiao) {
        return window.LegacyAPI.post('/stock/filter/zhibiao', { zhibiao: zhibiao });
      },
      
      // 组合筛选（题材 + 因子 + 指标）
      getCombinedFilterInfo: function(themes, factors, zhibiao) {
        return window.LegacyAPI.post('/stock/filter/themes-factors-zhibiao', {
          themes: themes,
          factors: factors,
          zhibiao: zhibiao
        });
      },
      // 股票详情（悬浮提示使用）
      getDetailInfo: function(code) {
        return window.LegacyAPI.post('/stock/filter/detail', { code: code });
      }
    },
    
    // 因子映射常量（直接使用全局变量）
    factorMapping: {
      // 中文显示名 -> 英文键名（用于 legacy 页面转换）
      chineseToEnglish: function() {
        if (window.FactorMapping && window.FactorMapping.CHINESE_TO_ENGLISH_MAP) {
          return window.FactorMapping.CHINESE_TO_ENGLISH_MAP;
        } else {
          console.warn('CHINESE_TO_ENGLISH_MAP 不可用，返回空对象');
          return {};
        }
      }()
    },
    
    // 工具函数（对应 web/src/utils/stockFilterUtils.js）
    utils: {
      // 收集筛选因子
      collectFactors: function(all) {
        var out = [];
        var selectedFactors = {
          fundamental: [],
          technical: [],
          capital: []
        };
        var indicatorSpecial = '';
        
        // 基本面因子映射（使用全局变量）
        var fundamentalNameMap = (window.FactorMapping && window.FactorMapping.FUNDAMENTAL_NAME_MAP) || {};
        
        // 格式化范围
        var formatRange = function(text, addYi) {
          if (typeof text !== 'string') return text;
          var unit = addYi ? '亿' : '';
          var gt = text.match(/^(\d+(?:\.\d+)?)以上$/);
          if (gt) return '大于' + gt[1] + unit;
          var lt = text.match(/^(\d+(?:\.\d+)?)以下$/);
          if (lt) return '小于' + lt[1] + unit;
          var between = text.match(/^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)$/);
          if (between) return addYi ? between[1] + '~' + between[2] + unit : between[1] + '~' + between[2];
          return /\d/.test(text) ? text + unit : text;
        };
        
        // 格式化资金面范围
        var formatCapitalRange = function(text, key) {
          if (typeof text !== 'string') return text;
          
          // 处理陆股通净流入
          if (key === 'hkConnect') {
            if (text === '小于0') return '小于0';
            if (text === '0~1000万') return '0~1000万';
            if (text === '1000~5000万') return '1000~5000万';
            if (text === '5000~10000万') return '5000~10000万';
            if (text === '大于10000万') return '大于10000万';
          }
          
          // 处理大单净额
          if (key === 'bigOrderAmount') {
            if (text === '小于0') return '小于0';
            if (text === '0~1000万') return '0~1000万';
            if (text === '1000~5000万') return '1000~5000万';
            if (text === '大于5000万') return '大于5000万';
          }
          
          // 处理大单净量
          if (key === 'bigOrderNet') {
            if (text === '小于0') return '小于0';
            if (text === '0~1') return '0~1';
            if (text === '1~3') return '1~3';
            if (text === '大于3') return '大于3';
          }
          
          return text;
        };
        
        // 处理基本面
        var f = all.fundamental || {};
        Object.keys(fundamentalNameMap).forEach(function(key) {
          var val = f[key];
          if (!val) return;
          var metric = fundamentalNameMap[key];
          var addYi = (key === 'revenue' || key === 'netProfit');
          var normalized = formatRange(val, addYi);
          
          // 特殊处理ROE和净利润，确保格式与后端一致
          if (key === 'roe') {
            // ROE特殊处理：将"5以下"转换为"小于5"，"5~10"保持不变等
            if (val === '5以下') normalized = '小于5';
            else if (val === '20以上') normalized = '大于20';
          } else if (key === 'netProfit') {
            // 净利润特殊处理：将"亏损"保持不变，其他转换为"0~1亿"等格式
            if (val === '亏损') normalized = '亏损';
            else if (val === '0~1') normalized = '0~1亿';
            else if (val === '1~3') normalized = '1~3亿';
            else if (val === '3~5') normalized = '3~5亿';
            else if (val === '5以上') normalized = '大于5亿';
          } else if (key === 'revenue') {
            // 营业收入特殊处理：确保单位为亿
            if (val === '5以下') normalized = '小于5亿';
            else if (val === '5~10') normalized = '5~10亿';
            else if (val === '10~20') normalized = '10~20亿';
            else if (val === '20~50') normalized = '20~50亿';
            else if (val === '50以上') normalized = '大于50亿';
          } else if (key === 'pe') {
            // 市盈率特殊处理
            if (val === '10以下') normalized = '小于10';
            else if (val === '30~40') normalized = '30~40';
            else if (val === '40以上') normalized = '大于40';
          } else if (key === 'grossMargin') {
            // 销售毛利率特殊处理
            if (val === '5以下') normalized = '小于5';
            else if (val === '35~40') normalized = '35~40';
            else if (val === '40以上') normalized = '大于40';
          } else if (key === 'pb') {
            // 市净率特殊处理
            if (val === '1以下') normalized = '小于1';
            else if (val === '1.5~2') normalized = '1.5~2';
            else if (val === '2~3') normalized = '2~3';
            else if (val === '3以上') normalized = '大于3';
          } else if (key === 'debtRatio') {
            // 资产负债率特殊处理
            if (val === '10以下') normalized = '小于10';
            else if (val === '10~15') normalized = '10~15';
            else if (val === '15~30') normalized = '15~30';
            else if (val === '30以上') normalized = '大于30';
          }
          
          out.push(metric + '_' + normalized);
          selectedFactors.fundamental.push(metric);
        });
        
        // 处理特色指标
        var ind = all.indicator || {};
        if (ind.special) {
          indicatorSpecial = ind.special;
        }
        
        // 处理技术面
        var t = all.technical || {};
        if (t.macd) {
          out.push('MACD_' + t.macd);
          selectedFactors.technical.push('MACD');
        }
        if (t.kdj) {
          out.push('KDJ_' + t.kdj);
          selectedFactors.technical.push('KDJ');
        }
        if (t.boll) {
          out.push('BOLL_' + t.boll);
          selectedFactors.technical.push('BOLL');
        }
        if (t.kPattern) {
          out.push('单k组合_' + t.kPattern);
          selectedFactors.technical.push('单k组合');
        }
        if (t.ma) {
          if (t.ma === '多头排列') {
            out.push('均线_多头排列');
            selectedFactors.technical.push('均线');
          }
          if (t.ma === '均线粘合') {
            out.push('均线_粘合');
            selectedFactors.technical.push('均线');
          }
          if (t.ma === '股价站上5日线') {
            out.push('均线_股价站上5日线');
            selectedFactors.technical.push('均线');
          }
          if (t.ma === '股价站上60日线') {
            out.push('均线_股价站上60日线');
            selectedFactors.technical.push('均线');
          }
        }
        
        // 处理资金面（使用全局变量）
        var c = all.capital || {};
        var nameMap = (window.FactorMapping && window.FactorMapping.CAPITAL_NAME_MAP) || {};
        Object.keys(nameMap).forEach(function(key) {
          var val = c[key];
          if (!val) return;
          var metric = nameMap[key];
          // 使用新的格式化函数处理资金面因子范围
          var normalized = formatCapitalRange(val, key);
          out.push(metric + '_' + normalized);
          selectedFactors.capital.push(metric);
        });
        
        // 处理题材
        var themes = all.hotConcept && all.hotConcept.themes ? all.hotConcept.themes : [];
        
        return {
          factors: out,
          selectedFactors: selectedFactors,
          themes: themes,
          indicator: indicatorSpecial
        };
      },
      
      // 处理股票数据
      processStockData: function(rows, selectedFactors) {
        if (!Array.isArray(rows)) return [];
        return rows.map(function(x) {
          var out = { '股票代码': x.code || x['股票代码'] || '' };
          Object.keys(x).forEach(function(key) {
            if (key !== 'code' && key !== 'con_code') {
              out[key] = x[key];
            }
          });
          return out;
        });
      }
    }
  };
  
})();
