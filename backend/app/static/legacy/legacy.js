(function() {
  // 使用统一的 API 适配层
  var API = window.LegacyAPI;

  // 保障共享配置存在（避免未加载或加载失败导致白屏）
  var FC = (function(){
    var empty = { INDICATOR_OPTIONS: [], FACTOR_CATEGORIES: { fundamental: [], technical: [], capital: [] }, FACTOR_RANGES: {} };
    try { return window.FactorConfig || empty; } catch(e) { return empty; }
  })();

  // 动态按接口类型解析返回值
  function toArray(obj) {
    if (Array.isArray(obj)) return obj;
    var list = [];
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(function(code){
        var row = obj[code] || {};
        if (row && typeof row === 'object') {
          if (!row['股票代码']) row['股票代码'] = code;
          list.push(row);
        }
      });
    }
    return list;
  }
  // 统一的数据解析函数（复用所有解析逻辑）
  function parseStockData(res) {
    var rows = toArray(res);
    var f = window.StockFilterFactory && window.StockFilterFactory();
    if (f && f.processStockData) return f.processStockData(rows, {});
    return API.utils.processStockData(rows, {});
  }

  new Vue({
    el: '#app-legacy',
    data: function() {
      return {
        themes: [],
        selectedThemes: [],
        // 使用共享配置（容错）
        indicatorOptions: FC.INDICATOR_OPTIONS,
        indicator: '',
        // 题材"更多"弹窗可见性（使用现成弹窗脚本绑定 appRef.themesDialog）
        themesDialog: false,
        // 因子配置（使用共享配置）
        basicFactors: FC.FACTOR_CATEGORIES.fundamental,
        technicalFactors: FC.FACTOR_CATEGORIES.technical,
        capitalFactors: FC.FACTOR_CATEGORIES.capital,
        selectedFactorMap: {},
        tempFactorMap: {},
        factorPopoverVisible: {},
        selectedFactors: [],
        factorRanges: FC.FACTOR_RANGES,
        tableData: [],
        pageSize: 20,
        currentPage: 1,
        hoverDetail: {},
        hoverDetailHtml: '',
        // 排序状态
        sortColumn: '',
        sortOrder: 'ascending'
      };
    },
    computed: {
      pagedList: function() {
        var start = (this.currentPage - 1) * this.pageSize;
        return this.tableData.slice(start, start + this.pageSize);
      },
      topThemes: function() {
        return this.themes.slice(0, 10);
      },
      selectedCount: function() {
        var c = 0;
        c += this.indicator ? 1 : 0;
        c += (this.selectedThemes && this.selectedThemes.length) ? this.selectedThemes.length : 0;
        c += (this.selectedFactors && this.selectedFactors.length) ? this.selectedFactors.length : 0;
        return c;
      },
      // 动态列名：根据返回数据自动推导
      dataColumns: function(){
        return this.processTableColumns(this.tableData);
      }
    },
    methods: {
      formatCodeLink: function(code) {
        var mod = window.StockLinkFactory && window.StockLinkFactory();
        // 与主站一致：跳分析系统
        if (mod && mod.formatStockAnalysisUrl) return mod.formatStockAnalysisUrl(code);
        var host = (window.__ANALYSIS_HOST || 'http://192.168.1.188:8077').replace(/\/$/,'');
        return host + '/analysis?stock_code=' + encodeURIComponent(String(code || ''));
      },
      onCodeClick: function(event, code){
        var mod = window.StockLinkFactory && window.StockLinkFactory();
        if (mod && typeof mod.handleStockCodeClick === 'function') {
          var handled = mod.handleStockCodeClick(event, code);
          if (handled === 'tdx') return; // 已在函数内完成跳转
        }
        // 非通达信环境：保持 a 标签默认导航
      },
      getColumnLabel: function(col){ return col; },
      getColumnWidth: function(col){
        var m = {
          '股票代码': 120,
          '股票简称': 120,
          '题材描述': 380
        };
        return m[col] || 110;
      },
      
      // 显示筛选结果提示（复用主站的提示语逻辑）
      showSearchResult: function(data) {
        if (data && data.length > 0) {
          this.$message && this.$message.success('搜索完成，搜索到' + data.length + '支股票');
        } else {
          this.$message && this.$message.info('未找到符合条件的股票');
        }
      },
      
      // 处理筛选结果（复用数据处理逻辑）
      handleSearchResult: function(res, parseFunction) {
        this.tableData = parseFunction(res);
        this.currentPage = 1;
        // 默认按第一个数值列升序排序
        this.applyDefaultSort();
        this.showSearchResult(this.tableData);
      },
      
      // 处理筛选错误（复用错误处理逻辑）
      handleSearchError: function(error, operation) {
        this.$message && this.$message.error(operation + '失败: ' + error.message);
      },
      
      // 应用默认排序（按第一个基本面和资金面因子列降序，否则按股票代码升序）
      applyDefaultSort: function() {
        if (!this.tableData || this.tableData.length === 0) return;
        
        // 找到第一个基本面和资金面因子列
        var firstRow = this.tableData[0];
        var sortableColumns = this.dataColumns.filter(function(col) {
          if (col === '股票代码' || col === '股票简称') return false;
          // 只对基本面和资金面因子进行排序
          var isBasicFactor = FC.FACTOR_CATEGORIES.fundamental.indexOf(col) > -1;
          var isCapitalFactor = FC.FACTOR_CATEGORIES.capital.indexOf(col) > -1;
          if (!isBasicFactor && !isCapitalFactor) return false;
          
          var value = firstRow[col];
          return value !== null && value !== undefined && !isNaN(parseFloat(value));
        });
        
        if (sortableColumns.length > 0) {
          // 有基本面和资金面因子，按第一个因子降序排序
          this.sortColumn = sortableColumns[0];
          this.sortOrder = 'descending';
        } else {
          // 没有基本面和资金面因子，按股票代码升序排序
          this.sortColumn = '股票代码';
          this.sortOrder = 'ascending';
        }
        this.sortTableData();
      },
      
      // 排序表格数据
      sortTableData: function() {
        if (!this.sortColumn || !this.tableData || this.tableData.length === 0) return;
        
        var self = this;
        this.tableData.sort(function(a, b) {
          var aVal = a[self.sortColumn];
          var bVal = b[self.sortColumn];
          
          // 处理数值类型
          if (!isNaN(parseFloat(aVal)) && !isNaN(parseFloat(bVal))) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
          }
          
          // 处理空值
          if (aVal === null || aVal === undefined) aVal = '';
          if (bVal === null || bVal === undefined) bVal = '';
          
          var result = 0;
          if (aVal < bVal) result = -1;
          else if (aVal > bVal) result = 1;
          
          return self.sortOrder === 'ascending' ? result : -result;
        });
      },
      
      // 处理用户点击排序
      sortChange: function(column) {
        if (!column.prop) return;
        
        this.sortColumn = column.prop;
        this.sortOrder = column.order || 'ascending';
        this.sortTableData();
      },
      
      // 判断列是否可排序（基本面和资金面因子可排序，股票代码也可排序）
      isSortableColumn: function(col) {
        if (col === '股票简称') return false;
        // 基本面和资金面因子可排序
        var isBasicFactor = FC.FACTOR_CATEGORIES.fundamental.indexOf(col) > -1;
        var isCapitalFactor = FC.FACTOR_CATEGORIES.capital.indexOf(col) > -1;
        // 股票代码也可排序
        var isStockCode = col === '股票代码';
        return isBasicFactor || isCapitalFactor || isStockCode;
      },
      
      // 因子分类配置（使用共享配置，容错）
      getFactorCategories: function() {
        return FC.FACTOR_CATEGORIES;
      },
      
      // 获取所有因子列表（复用因子配置逻辑）
      getAllFactors: function() {
        var categories = this.getFactorCategories();
        return categories.fundamental.concat(categories.technical).concat(categories.capital);
      },
      
      // 按类型分类因子（复用因子分类逻辑）
      categorizeFactors: function(allSelectedFactors) {
        var categories = this.getFactorCategories();
        var keyMapping = API.factorMapping.chineseToEnglish || {};
        var result = { fundamental: {}, technical: {}, capital: {} };
        
        Object.keys(allSelectedFactors).forEach(function(factorName) {
          var factorValue = allSelectedFactors[factorName];
          if (!factorValue) return;
          
          var englishKey = keyMapping[factorName];
          if (!englishKey) return;
          
          // 按类型分类
          if (categories.fundamental.indexOf(factorName) > -1) {
            result.fundamental[englishKey] = factorValue;
          } else if (categories.technical.indexOf(factorName) > -1) {
            result.technical[englishKey] = factorValue;
          } else if (categories.capital.indexOf(factorName) > -1) {
            result.capital[englishKey] = factorValue;
          }
        });
        
        return result;
      },
      
      // 筛选条件判断（复用条件判断逻辑）
      hasCombinedFilters: function() {
        return (this.indicator || (this.selectedFactors && this.selectedFactors.length)) && 
               this.selectedThemes && this.selectedThemes.length;
      },
      
      hasIndicatorOnly: function() {
        return this.indicator && 
               (!this.selectedThemes || this.selectedThemes.length === 0) && 
               (!this.selectedFactors || this.selectedFactors.length === 0);
      },
      
      hasFactorsOnly: function() {
        return this.selectedFactors && this.selectedFactors.length > 0 && 
               (!this.selectedThemes || this.selectedThemes.length === 0) && 
               !this.indicator;
      },
      
      hasThemesOnly: function() {
        return this.selectedThemes && this.selectedThemes.length > 0 && 
               (!this.selectedFactors || this.selectedFactors.length === 0) && 
               !this.indicator;
      },
      
      // 更新因子选择状态（复用因子操作逻辑）
      updateSelectedFactors: function() {
        var apiFactors = this.buildFactorsForApi();
        this.selectedFactors = apiFactors;
        this.loadData();
      },
      
      // 处理表格列（复用列处理逻辑）
      processTableColumns: function(data) {
        if (!data || data.length === 0) return this.selectedCount === 0 ? [] : this.getDefaultColumns();
        var first = data[0] || {};
        var cols = Object.keys(first);
        var head = this.getDefaultColumns();
        // 去除重复与不需要的列
        cols = cols.filter(function(k){ return head.indexOf(k) === -1 && k !== '交易日期'; });
        // 将热度值放到最后
        var heatIdx = cols.indexOf('热度值');
        if (heatIdx > -1) {
          cols.splice(heatIdx, 1);
          cols.push('热度值');
        }
        return head.concat(cols);
      },
      
      // 获取默认列配置（复用列配置逻辑）
      getDefaultColumns: function() {
        return ['股票代码','股票简称'];
      },
      
      onShowDetail: function(code){
        var self = this;
        if (!code) return;
        API.stockAPI.getDetailInfo(code).then(function(resp){
          var data = resp && resp.data ? resp.data : (resp || {});
          self.hoverDetail = data;
          // 生成与主站一致的 HTML
          var tt = window.StockTooltipFactory && window.StockTooltipFactory();
          self.hoverDetailHtml = tt && tt.renderContent ? tt.renderContent(data) : '';
        }).catch(function(){
          self.hoverDetail = {};
          self.hoverDetailHtml = '';
        });
      },
      // 将页面选择的因子转换为后端所需格式，如 'MACD_金叉'
      buildFactorsForApi: function(){
        // 使用公共函数按类型分类因子
        var categorizedFactors = this.categorizeFactors(this.selectedFactorMap || {});
        
        var allFilters = {
          fundamental: categorizedFactors.fundamental,
          technical: categorizedFactors.technical,
          capital: categorizedFactors.capital,
          indicator: this.indicator ? { special: this.indicator } : {},
          hotConcept: { themes: this.selectedThemes || [] }
        };
        
        // 调用主站的 collectFactors 函数
        var f = window.StockFilterFactory && window.StockFilterFactory();
        var result = f && f.collectFactors ? f.collectFactors(allFilters) : API.utils.collectFactors(allFilters);
        return result.factors;
      },
      loadThemes: function() {
        var self = this;
        // 直接复用主站缓存逻辑
        var cacheApi = window.__ThemesCacheModuleFactory && window.__ThemesCacheModuleFactory();
        if (cacheApi && typeof cacheApi.getThemesData === 'function') {
          cacheApi.getThemesData(function(){
            return API.stockAPI.getAllThemes();
          }).then(function(result){
            var list = (result && result.themes) ? result.themes : [];
            self.themes = list.map(function(item){ return typeof item === 'string' ? item : (item && item.name) || ''; }).filter(Boolean);
          }).catch(function(){
            // 兜底：直接调接口
            API.stockAPI.getAllThemes().then(function(res){
              var list = res && res.themes ? res.themes : [];
              self.themes = list.map(function(item){ return typeof item === 'string' ? item : (item && item.name) || ''; }).filter(Boolean);
            });
          });
        } else {
          // 兜底：直接调接口
          API.stockAPI.getAllThemes().then(function(res){
            var list = res && res.themes ? res.themes : [];
            self.themes = list.map(function(item){ return typeof item === 'string' ? item : (item && item.name) || ''; }).filter(Boolean);
          });
        }
      },
      loadData: function() {
        var self = this;
        
        // 使用公共函数判断筛选条件
        if (this.hasCombinedFilters()) {
          var apiFactorsCombined = this.buildFactorsForApi();
          if (this.indicator) {
            // 指标 + (题材或因子)
            API.stockAPI.getCombinedFilterInfo(this.selectedThemes, apiFactorsCombined, this.indicator)
              .then(function(res){
                self.handleSearchResult(res, parseStockData);
              })
              .catch(function(err){ self.handleSearchError(err, '组合筛选'); });
          } else {
            // 只有题材 + 因子
            API.stockAPI.getMultiThemeAndFactorInfo(this.selectedThemes, apiFactorsCombined)
              .then(function(res){
                self.handleSearchResult(res, parseStockData);
              })
              .catch(function(err){ self.handleSearchError(err, '题材+因子筛选'); });
          }
          return;
        }
        
        if (this.hasIndicatorOnly()) {
          API.stockAPI.getZhibiaoInfo(this.indicator)
            .then(function(res){
              self.handleSearchResult(res, parseStockData);
            })
            .catch(function(err){ self.handleSearchError(err, '指标查询'); });
          return;
        }
        
        if (this.hasFactorsOnly()) {
          var apiFactors = this.buildFactorsForApi();
          API.stockAPI.getStocksByFactorsSelection(apiFactors)
            .then(function(res){
              self.handleSearchResult(res, parseStockData);
            })
            .catch(function(err){ self.handleSearchError(err, '因子筛选'); });
          return;
        }
        
        if (this.hasThemesOnly()) {
          API.stockAPI.getThemesInfo(this.selectedThemes)
            .then(function(res){
              self.handleSearchResult(res, parseStockData);
            })
            .catch(function(err){ self.handleSearchError(err, '题材筛选'); });
          return;
        }
        
        // 无筛选条件
        this.tableData = [];
        this.currentPage = 1;
      },
      toggleIndicator: function(opt) {
        this.indicator = (this.indicator === opt) ? '' : opt;
        this.loadData();
      },
      toggleTheme: function(t) {
        var idx = this.selectedThemes.indexOf(t);
        if (idx > -1) this.selectedThemes.splice(idx,1); else this.selectedThemes.push(t);
        this.loadData();
      },
      isFactorSelected: function(f) {
        return !!this.selectedFactorMap[f];
      },
      onFactorChange: function(key){
        var val = this.tempFactorMap[key];
        if (val) {
          this.$set(this.selectedFactorMap, key, val);
        } else {
          this.$delete(this.selectedFactorMap, key);
        }
        this.$set(this.factorPopoverVisible, key, false);
        this.updateSelectedFactors();
      },
      removeFactor: function(key){
        this.$delete(this.selectedFactorMap, key);
        this.$delete(this.tempFactorMap, key);
        this.updateSelectedFactors();
      },
      handleReset: function() {
        this.indicator = '';
        this.selectedThemes = [];
        this.selectedFactorMap = {};
        this.tempFactorMap = {};
        this.factorPopoverVisible = {};
        this.updateSelectedFactors();
      }
    },
    mounted: function() {
      this.updateSelectedFactors();
      this.loadThemes();
      this.loadData();
    }
  });
})();


