// 股票代码跳转共享核心（主站与 legacy 共用唯一源码）
// 暴露工厂：window.StockLinkFactory()
(function(){
  if (window.StockLinkFactory) return;

  window.StockLinkFactory = function(){
    function getStockHost(){
      try { return window.__STOCK_HOST || 'http://192.168.1.25:3000'; } catch(_) { return 'http://192.168.1.25:3000'; }
    }
    function getAnalysisHost(){
      try { return window.__ANALYSIS_HOST || 'http://192.168.1.188:8077'; } catch(_) { return 'http://192.168.1.188:8077'; }
    }

    function formatStockCodeLink(stockCode){
      var host = getStockHost();
      return host.replace(/\/$/,'') + '/code_' + String(stockCode || '');
    }

    function isMobile(){
      try {
        var ua = navigator.userAgent || '';
        return /Android|webOS|iPhone|iPod|iPad|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      } catch(_) { return false; }
    }

    function formatTreeIdUrl(stockCode){
      return 'http://www.treeid/code_' + String(stockCode || '');
    }

    function formatStockAnalysisUrl(stockCode){
      var host = getAnalysisHost();
      return host.replace(/\/$/,'') + '/analysis?stock_code=' + encodeURIComponent(String(stockCode || ''));
    }

    function handleStockCodeClick(event, stockCode){
      try {
        var qp; try { qp = new URL(window.location.href).searchParams; } catch(_) { qp = new URLSearchParams(''); }
        var forceTdx = /^(1|true)$/i.test((qp.get('tdx') || ''));
        var byUA = false;
        try {
          var ua = navigator.userAgent || '';
          byUA = /TdxBrowser|TdxW|tdx|TongDaXin/i.test(ua);
        } catch(_){ byUA = false; }
        var byExternal = !!(window.external && (window.external.GetCookie || window.external.GetSecurityInfo));
        var isTdx = Boolean(byUA || byExternal || forceTdx);
        if (!isMobile() && isTdx) {
          if (event && typeof event.preventDefault === 'function') event.preventDefault();
          window.location.href = formatTreeIdUrl(stockCode);
          return 'tdx';
        }
      } catch(_){ }
      return false;
    }

    return {
      getStockHost: getStockHost,
      getAnalysisHost: getAnalysisHost,
      formatStockCodeLink: formatStockCodeLink,
      formatStockAnalysisUrl: formatStockAnalysisUrl,
      handleStockCodeClick: handleStockCodeClick,
      formatTreeIdUrl: formatTreeIdUrl,
      isMobile: isMobile
    };
  };
})();


