import { get, post } from './index.js'

/**
 * 获取筛选分类配置
 * 功能描述：获取所有可用的筛选分类及其状态
 * 入参：无
 * 返回参数：筛选分类配置对象
 * url地址：/stock/filter/categories
 * 请求方式：GET
 */
export function getFilterCategories() {
  return get('/stock/filter/categories')
}

/**
 * 获取指定分类的筛选条件
 * 功能描述：获取指定分类下的所有筛选条件和数据范围
 * 入参：category - 分类名称(fundamental/technical/capital)
 * 返回参数：筛选条件配置对象
 * url地址：/stock/filter/conditions
 * 请求方式：GET
 */
export function getFilterConditions(category) {
  return get('/stock/filter/conditions', { category })
}

/**
 * 根据筛选条件获取股票列表
 * 功能描述：根据用户选择的筛选条件查询符合条件的股票
 * 入参：filterParams - 筛选参数对象
 * 返回参数：股票列表数据
 * url地址：/stock/filter/search
 * 请求方式：POST
 */
export function getStocksByFilter(filterParams) {
  return post('/stock/filter/search', filterParams)
}

/**
 * 获取股票详细信息
 * 功能描述：获取指定股票的详细信息
 * 入参：stockCode - 股票代码
 * 返回参数：股票详细信息
 * url地址：/stock/detail
 * 请求方式：GET
 */
export function getStockDetail(stockCode) {
  return get('/stock/detail', { stockCode })
}

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