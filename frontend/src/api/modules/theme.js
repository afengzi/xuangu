import { get, post } from '../index.js'

/**
 * 题材相关API
 */

/**
 * 获取所有题材列表
 * 功能描述：获取系统中所有可用的题材列表
 * 入参：无
 * 返回参数：题材列表
 * url地址：/theme/list
 * 请求方式：GET
 */
export const getAllThemes = () => get('/theme/list')

/**
 * 题材筛选：获取题材对应的股票数据
 * 功能描述：根据选择的题材获取对应的股票数据
 * 入参：themes - 题材数组
 * 返回参数：题材对应的股票数据
 * url地址：/stock/filter/themes
 * 请求方式：POST
 */
export const getThemesInfo = (themes) => post('/stock/filter/themes', { themes })

/**
 * 题材详情：获取指定题材的详细信息
 * 功能描述：获取指定题材的详细信息和相关股票
 * 入参：theme - 题材名称
 * 返回参数：题材详细信息
 * url地址：/theme/detail
 * 请求方式：GET
 */
export const getThemeDetail = (theme) => get('/theme/detail', { theme })
