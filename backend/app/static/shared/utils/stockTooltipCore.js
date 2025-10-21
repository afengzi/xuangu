// 股票悬浮提示内容渲染（主站与 legacy 共享）
// 暴露工厂：window.StockTooltipFactory()
(function(){
  if (window.StockTooltipFactory) return;

  window.StockTooltipFactory = function(){
    function renderContent(data){
      if (!data) return '<div style="padding: 6px; font-size: 12px;">暂无详细信息</div>';
      var latest = data.latest_theme || data.latestTheme || data.theme || '';
      var recent = data.recent_fluctuation_theme || data.recentFluctuationTheme || data.fluctuation_theme || '';
      var lines = [];
      if (latest) { lines.push(latest); lines.push(''); }
      if (recent) { lines.push(recent); }
      var html = '<div style="padding: 6px; font-size: 12px; max-width: 280px;">' +
                 lines.join('<br>').replace(/\n/g,'<br>') +
                 '</div>';
      return html;
    }

    return { renderContent: renderContent };
  };
})();


