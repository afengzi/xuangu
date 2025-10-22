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
        // GET请求参数处理
        if (data) {
          var params = [];
          for (var key in data) {
            if (data.hasOwnProperty(key)) {
              params.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
          }
          if (params.length > 0) {
            url += (url.indexOf('?') === -1 ? '?' : '&') + params.join('&');
          }
        }
      } else {
        // POST等请求参数处理
        config.body = JSON.stringify(data || {});
      }
      
      // 合并自定义选项
      if (options) {
        for (var opt in options) {
          if (options.hasOwnProperty(opt)) {
            config[opt] = options[opt];
          }
        }
      }
      
      // 返回 Promise 风格的请求
      return new Promise(function(resolve, reject) {
        fetch(url, config)
          .then(function(response) {
            // 处理非200状态码
            if (!response.ok) {
              return response.json().then(function(errorData) {
                reject(errorData || { message: '请求失败: ' + response.status });
              }).catch(function() {
                reject({ message: '请求失败: ' + response.status });
              });
            }
            return response.json();
          })
          .then(function(data) {
            resolve(data);
          })
          .catch(function(error) {
            reject(error);
          });
      });
    },
    
    // 便捷方法
    get: function(url, params) {
      return this.request('get', this.API_BASE + url, params);
    },
    
    post: function(url, data) {
      return this.request('post', this.API_BASE + url, data);
    },
    
    // 股票数据接口
    getStockData: function(params) {
      console.log('发起股票数据请求:', params);
      var queryParams = new URLSearchParams();
      for (var key in params) {
        if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
          queryParams.append(key, params[key]);
        }
      }
      var requestUrl = this.API_BASE + '/stocks?' + queryParams.toString();
      console.log('请求URL:', requestUrl);
      
      return fetch(requestUrl, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        mode: 'cors',
        credentials: 'omit'
      })
      .then(function(response) {
        console.log('响应状态:', response.status);
        if (!response.ok) {
          return response.text().then(function(text) {
            console.error('API响应错误内容:', text);
            return []; // 出错时返回空数组
          });
        }
        return response.json();
      })
      .then(function(data) {
        console.log('获取到股票数据:', data);
        return data;
      })
      .catch(function(error) {
        console.error('获取股票数据失败:', error);
        return [];
      });
    },
    
    // 主题数据接口
    getThemeData: function(params) {
      return this.get('/theme/list', params);
    },
    
    // 因子筛选接口
    filterStocksByFactors: function(params) {
      return this.post('/stock/filter/factors', params);
    },
    
    // 主题筛选接口
    filterStocksByThemes: function(params) {
      return this.post('/stock/filter/themes', params);
    },
    
    // 主题因子联合筛选
    filterStocksByThemesAndFactors: function(params) {
      return this.post('/stock/filter/themes-and-factors', params);
    },
    
    // 登录接口
    login: function(username, password) {
      return this.post('/login', {
        username: username,
        password: password
      }).then(function(response) {
        // 存储token
        if (response.token) {
          try {
            localStorage.setItem('admin_token', response.token);
          } catch (e) {
            console.error('无法存储token:', e);
          }
        }
        return response;
      });
    },
    
    // 登出
    logout: function() {
      try {
        localStorage.removeItem('admin_token');
      } catch (e) {
        console.error('无法清除token:', e);
      }
    },
    
    // 检查登录状态
    checkLoginStatus: function() {
      try {
        return !!localStorage.getItem('admin_token');
      } catch (e) {
        return false;
      }
    }
  };
})();