// 题材缓存核心实现（单一源码）
// 通过全局工厂函数暴露，供 ESM 与非模块页面复用
(function(){
  if (window.ThemesCacheFactory) return; // 避免重复定义

  window.ThemesCacheFactory = function(){
    var THEMES_CACHE_KEY = 'hot_themes_cache';
    var CACHE_VERSION = '1.2';
    var DAILY_UPDATE_TIME = '08:35';
    var CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时
    var MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7天
    var REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2小时

    function ThemesCache(){
      this.cache = null;
      this.lastUpdateTime = null;
      this.isLoading = false;
      this.loadPromise = null;
      this.updateInProgress = false;
    }

    ThemesCache.prototype.getCachedThemes = function(){
      try {
        var cached = localStorage.getItem(THEMES_CACHE_KEY);
        if (cached) {
          var data = JSON.parse(cached);
          if (data.version === CACHE_VERSION && this.isCacheValid(data.lastUpdate)) {
            this.cache = data.themes;
            this.lastUpdateTime = data.lastUpdate;
            return this.cache;
          }
        }
      } catch (e) { console.warn('读取题材缓存失败:', e); }
      return null;
    };

    ThemesCache.prototype.isCacheValid = function(lastUpdateTime){
      if (!lastUpdateTime) return false;
      var now = new Date();
      var lastUpdate = new Date(lastUpdateTime);
      var age = now.getTime() - lastUpdate.getTime();
      return age < CACHE_DURATION && age < MAX_CACHE_AGE;
    };

    ThemesCache.prototype.setCachedThemes = function(themes){
      try {
        var cacheData = { themes: themes, lastUpdate: new Date().toISOString(), version: CACHE_VERSION };
        localStorage.setItem(THEMES_CACHE_KEY, JSON.stringify(cacheData));
        this.cache = themes;
        this.lastUpdateTime = cacheData.lastUpdate;
      } catch (e) { console.warn('保存题材缓存失败:', e); }
    };

    ThemesCache.prototype.shouldUpdate = function(){
      if (this.updateInProgress) return false;
      var cached = this.getCachedThemes();
      if (!cached) return true;
      if (!this.isCacheValid(this.lastUpdateTime)) return true;
      var now = new Date();
      var lastUpdate = new Date(this.lastUpdateTime);
      var timeSinceUpdate = now.getTime() - lastUpdate.getTime();
      if (timeSinceUpdate > REFRESH_THRESHOLD) {
        var currentTime = now.toTimeString().slice(0,5);
        if (currentTime >= DAILY_UPDATE_TIME) {
          if (lastUpdate.toDateString() !== now.toDateString()) return true;
          if (lastUpdate.toTimeString().slice(0,5) < DAILY_UPDATE_TIME) return true;
        }
      }
      try {
        var pageLoadTime = sessionStorage.getItem('page_load_time');
        var nowMs = Date.now();
        if (!pageLoadTime) { sessionStorage.setItem('page_load_time', String(nowMs)); return false; }
        var loadTime = parseInt(pageLoadTime, 10);
        if (nowMs - loadTime < 5 * 60 * 1000) return true;
        sessionStorage.setItem('page_load_time', String(nowMs));
      } catch(e) { console.warn('检查页面刷新状态失败:', e); }
      return false;
    };

    ThemesCache.prototype.getCacheInfo = function(){
      var cached = this.getCachedThemes();
      return { hasCache: !!cached, lastUpdate: this.lastUpdateTime, count: cached ? cached.length : 0, shouldUpdate: this.shouldUpdate() };
    };

    ThemesCache.prototype.clearCache = function(){
      try { localStorage.removeItem(THEMES_CACHE_KEY); this.cache = null; this.lastUpdateTime = null; }
      catch(e){ console.warn('清理题材缓存失败:', e); }
    };

    var themesCache = new ThemesCache();

    function getThemesData(getAllThemesApi){
      if (themesCache.isLoading && themesCache.loadPromise) return themesCache.loadPromise;
      var cached = themesCache.getCachedThemes();
      if (cached && !themesCache.shouldUpdate()) {
        return Promise.resolve({ themes: cached, fromCache: true, lastUpdate: themesCache.lastUpdateTime });
      }
      themesCache.isLoading = true; themesCache.updateInProgress = true;
      themesCache.loadPromise = Promise.resolve().then(function(){ return getAllThemesApi(); }).then(function(resp){
        var themes = (resp && resp.themes) || [];
        themesCache.setCachedThemes(themes);
        return { themes: themes, fromCache: false, lastUpdate: themesCache.lastUpdateTime };
      }).catch(function(err){
        var stale = themesCache.getCachedThemes();
        if (stale) return { themes: stale, fromCache: true, lastUpdate: themesCache.lastUpdateTime, isStale: true };
        throw err;
      }).finally(function(){ themesCache.isLoading = false; themesCache.updateInProgress = false; themesCache.loadPromise = null; });
      return themesCache.loadPromise;
    }

    function preloadThemesData(getAllThemesApi){
      var info = themesCache.getCacheInfo();
      if (info.shouldUpdate) return getThemesData(getAllThemesApi);
      var cached = themesCache.getCachedThemes() || [];
      return Promise.resolve({ themes: cached, fromCache: true, lastUpdate: info.lastUpdate });
    }

    function refreshThemesData(getAllThemesApi){ themesCache.clearCache(); return getThemesData(getAllThemesApi); }
    function forceRefreshThemesData(getAllThemesApi){ themesCache.updateInProgress=false; themesCache.isLoading=false; themesCache.loadPromise=null; themesCache.clearCache(); return getThemesData(getAllThemesApi); }
    function getThemesCacheInfo(){ return themesCache.getCacheInfo(); }

    return {
      themesCache: themesCache,
      getThemesData: getThemesData,
      preloadThemesData: preloadThemesData,
      refreshThemesData: refreshThemesData,
      forceRefreshThemesData: forceRefreshThemesData,
      getThemesCacheInfo: getThemesCacheInfo
    };
  };
})();


