/**
 * Legacy API 适配层 直接调用 web/src 下已实现的代码
 * 为 IE 兼容页面提供与主站一致的 API 调用方式
 */

// 模拟 ES6 模块导入（IE11 兼容）
(function() {
  'use strict';
  
  // 全局 API 对象
  window.LegacyAPI = {
    // 基础配置
    API_BASE: 'http://localhost:5001/api',
    
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
      chineseToEnglish: window.FactorMapping.CHINESE_TO_ENGLISH_MAP
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
        var fundamentalNameMap = window.FactorMapping.FUNDAMENTAL_NAME_MAP;
        
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
        
        // 处理基本面
        var f = all.fundamental || {};
        Object.keys(fundamentalNameMap).forEach(function(key) {
          var val = f[key];
          if (!val) return;
          var metric = fundamentalNameMap[key];
          var addYi = (key === 'revenue' || key === 'netProfit');
          var normalized = formatRange(val, addYi);
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
            out.push('股价站上5日线');
            selectedFactors.technical.push('均线');
          }
          if (t.ma === '股价站上60日线') {
            out.push('均线_股价站上60日线');
            selectedFactors.technical.push('均线');
          }
        }
        
        // 处理资金面（使用全局变量）
        var c = all.capital || {};
        var nameMap = window.FactorMapping.CAPITAL_NAME_MAP;
        Object.keys(nameMap).forEach(function(key) {
          var val = c[key];
          if (!val) return;
          var metric = nameMap[key];
          var withUnit = val;
          if (key === 'hkConnect') {
            withUnit = /\d/.test(val) ? val + '万' : val;
          }
          if (key === 'bigOrderAmount') {
            withUnit = String(val).replace(/万$/, '');
          }
          out.push(metric + '_' + withUnit);
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
