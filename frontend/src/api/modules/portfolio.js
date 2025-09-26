import { get, post, put, del } from '../index.js'

/**
 * 股票组合相关API
 */

/**
 * 创建股票组合
 * 功能描述：创建新的股票投资组合
 * 入参：portfolioData - 组合信息
 * 返回参数：创建结果
 * url地址：/portfolio/create
 * 请求方式：POST
 */
export function createPortfolio(portfolioData) {
  return post('/portfolio/create', portfolioData)
}

/**
 * 获取用户股票组合列表
 * 功能描述：获取用户创建的所有股票组合
 * 入参：无
 * 返回参数：组合列表
 * url地址：/portfolio/list
 * 请求方式：GET
 */
export function getPortfolioList() {
  return get('/portfolio/list')
}

/**
 * 更新股票组合
 * 功能描述：更新指定股票组合的信息
 * 入参：portfolioId, updateData
 * 返回参数：更新结果
 * url地址：/portfolio/update
 * 请求方式：PUT
 */
export function updatePortfolio(portfolioId, updateData) {
  return put('/portfolio/update', { portfolioId, ...updateData })
}

/**
 * 删除股票组合
 * 功能描述：删除指定的股票组合
 * 入参：portfolioId
 * 返回参数：删除结果
 * url地址：/portfolio/delete
 * 请求方式：DELETE
 */
export function deletePortfolio(portfolioId) {
  return del('/portfolio/delete', { portfolioId })
}
