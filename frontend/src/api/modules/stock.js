import { get, post, put, del } from '../index.js'

/**
 * 股票数据相关API
 */

/**
 * 获取股票实时价格
 * 功能描述：获取指定股票的实时价格信息
 * 入参：stockCodes - 股票代码数组
 * 返回参数：股票价格信息
 * url地址：/stock/price/realtime
 * 请求方式：POST
 */
export function getRealTimePrice(stockCodes) {
  return post('/stock/price/realtime', { stockCodes })
}

/**
 * 获取股票历史数据
 * 功能描述：获取指定股票的历史价格数据
 * 入参：stockCode, startDate, endDate, period
 * 返回参数：历史价格数据
 * url地址：/stock/price/history
 * 请求方式：GET
 */
export function getStockHistory(stockCode, startDate, endDate, period = 'daily') {
  return get('/stock/price/history', { 
    stockCode, 
    startDate, 
    endDate, 
    period 
  })
}

/**
 * 获取股票财务数据
 * 功能描述：获取指定股票的财务指标数据
 * 入参：stockCode, year, quarter
 * 返回参数：财务数据
 * url地址：/stock/financial
 * 请求方式：GET
 */
export function getStockFinancial(stockCode, year, quarter) {
  return get('/stock/financial', { stockCode, year, quarter })
}

/**
 * 获取股票技术指标
 * 功能描述：获取指定股票的技术分析指标
 * 入参：stockCode, indicators, period
 * 返回参数：技术指标数据
 * url地址：/stock/technical
 * 请求方式：GET
 */
export function getStockTechnical(stockCode, indicators = [], period = 'daily') {
  return get('/stock/technical', { stockCode, indicators, period })
}

/**
 * 获取股票详细信息（通过股票代码）
 * 功能描述：获取指定股票的详细信息
 * 入参：stockCode - 股票代码
 * 返回参数：股票详细信息
 * url地址：/stock/filter/detail
 * 请求方式：POST
 */
export function getDetailInfoByCode(stockCode) {
  return post('/stock/filter/detail', { code: stockCode })
}

/**
 * 获取特色指标对应的股票信息
 * 功能描述：根据特色指标名称获取对应的股票信息
 * 入参：zhibiao - 特色指标名称
 * 返回参数：特色指标对应的股票信息
 * url地址：/stock/filter/zhibiao
 * 请求方式：POST
 */
export function getZhibiaoInfo(zhibiao) {
  return post('/stock/filter/zhibiao', { zhibiao })
}

/**
 * 股票筛选相关API
 */

/**
 * 保存用户筛选条件
 * 功能描述：保存用户自定义的筛选条件配置
 * 入参：filterConfig - 筛选配置对象
 * 返回参数：保存结果
 * url地址：/stock/filter/save
 * 请求方式：POST
 */
export function saveFilterConfig(filterConfig) {
  return post('/stock/filter/save', filterConfig)
}

/**
 * 获取用户保存的筛选条件
 * 功能描述：获取用户之前保存的筛选条件配置
 * 入参：无
 * 返回参数：用户筛选条件列表
 * url地址：/stock/filter/saved
 * 请求方式：GET
 */
export function getSavedFilterConfigs() {
  return get('/stock/filter/saved')
}

/**
 * 删除保存的筛选条件
 * 功能描述：删除用户保存的指定筛选条件
 * 入参：configId - 配置ID
 * 返回参数：删除结果
 * url地址：/stock/filter/delete
 * 请求方式：DELETE
 */
export function deleteFilterConfig(configId) {
  return del('/stock/filter/delete', { configId })
}

// 使用现有的因子筛选接口
export const getStocksByFactorsSelection = (factors) => post('/stock/filter/factors', { factors })

// 多选题材和因子筛选：获取题材和因子交集的股票数据
export const getMultiThemeAndFactorInfo = (themes, factors) => post('/stock/filter/themes-and-factors', { themes, factors })

// 题材 + 因子 + 指标（指标单选，独立参数）
export const getCombinedFilterInfo = (themes, factors, zhibiao) => 
  post('/stock/filter/themes-factors-zhibiao', { themes, factors, zhibiao })
