// 股票筛选共享核心（因子收集与数据处理）
// 暴露工厂：window.StockFilterFactory()
(function(){
  if (window.StockFilterFactory) return;

  window.StockFilterFactory = function(){
    var FM = (typeof window !== 'undefined' && window.FactorMapping) ? window.FactorMapping : {};
    var FUNDAMENTAL_NAME_MAP = FM.FUNDAMENTAL_NAME_MAP || {};
    var CAPITAL_NAME_MAP = FM.CAPITAL_NAME_MAP || {};

    function formatRange(text, addYi){
      if (typeof text !== 'string') return text;
      var unit = addYi ? '亿' : '';
      var gt = text.match(/^(\d+(?:\.\d+)?)以上$/);
      if (gt) return '大于' + gt[1] + unit;
      var lt = text.match(/^(\d+(?:\.\d+)?)以下$/);
      if (lt) return '小于' + lt[1] + unit;
      var between = text.match(/^(\d+(?:\.\d+)?)~(\d+(?:\.\d+)?)$/);
      if (between) return addYi ? between[1] + '~' + between[2] + unit : between[1] + '~' + between[2];
      return /\d/.test(text) ? text + unit : text;
    }

    function collectFactors(all){
      var out = [];
      var selectedFactors = { fundamental: [], technical: [], capital: [] };
      var indicatorSpecial = '';

      var f = (all && all.fundamental) || {};
      Object.keys(FUNDAMENTAL_NAME_MAP).forEach(function(key){
        var val = f[key];
        if (!val) return;
        var metric = FUNDAMENTAL_NAME_MAP[key];
        var addYi = (key === 'revenue' || key === 'netProfit');
        var normalized = formatRange(val, addYi);
        out.push(metric + '_' + normalized);
        selectedFactors.fundamental.push(metric);
      });

      var ind = (all && all.indicator) || {};
      if (ind && ind.special) indicatorSpecial = ind.special;

      var t = (all && all.technical) || {};
      if (t.macd) { out.push('MACD_' + t.macd); selectedFactors.technical.push('MACD'); }
      if (t.kdj) { out.push('KDJ_' + t.kdj); selectedFactors.technical.push('KDJ'); }
      if (t.boll) { out.push('BOLL_' + t.boll); selectedFactors.technical.push('BOLL'); }
      if (t.kPattern) { out.push('单k组合_' + t.kPattern); selectedFactors.technical.push('单k组合'); }
      if (t.ma) {
        if (t.ma === '多头排列') { out.push('均线_多头排列'); selectedFactors.technical.push('均线'); }
        if (t.ma === '均线粘合') { out.push('均线_粘合'); selectedFactors.technical.push('均线'); }
        if (t.ma === '股价站上5日线') { out.push('股价站上5日线'); selectedFactors.technical.push('均线'); }
        if (t.ma === '股价站上60日线') { out.push('均线_股价站上60日线'); selectedFactors.technical.push('均线'); }
      }

      var c = (all && all.capital) || {};
      Object.keys(CAPITAL_NAME_MAP).forEach(function(key){
        var val = c[key];
        if (!val) return;
        var metric = CAPITAL_NAME_MAP[key];
        var withUnit = val;
        if (key === 'hkConnect') withUnit = /\d/.test(val) ? val + '万' : val;
        if (key === 'bigOrderAmount') withUnit = String(val).replace(/万$/,'');
        out.push(metric + '_' + withUnit);
        selectedFactors.capital.push(metric);
      });

      var themes = (all && all.hotConcept && all.hotConcept.themes) ? all.hotConcept.themes : [];
      return { factors: out, selectedFactors: selectedFactors, themes: themes, indicator: indicatorSpecial };
    }

    function processStockData(rows){
      if (!Array.isArray(rows)) return [];
      return rows.map(function(x){
        var out = { '股票代码': x.code || x['股票代码'] || '' };
        Object.keys(x).forEach(function(k){ if (k !== 'code' && k !== 'con_code') out[k] = x[k]; });
        return out;
      });
    }

    return { collectFactors: collectFactors, processStockData: processStockData };
  };
})();


