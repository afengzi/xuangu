import { FILTER_CATEGORIES, ALL_FILTERS } from '../utils/constants.js'

// Mock数据映射
const mockData = {
  '/stock/filter/categories': {
    code: 200,
    message: 'success',
    data: FILTER_CATEGORIES
  },
  '/stock/filter/conditions': {
    fundamental: { code: 200, message: 'success', data: ALL_FILTERS.fundamental },
    technical: { code: 200, message: 'success', data: ALL_FILTERS.technical },
    capital: { code: 200, message: 'success', data: ALL_FILTERS.capital }
  },
  '/stock/filter/search': {
    code: 200,
    message: 'success',
    data: {
      total: 150,
      stocks: [
        {
          code: '000001', name: '平安银行', price: 12.35, change: 0.25, changePercent: 2.07,
          revenue: 15.6, pe: 8.5, roe: 12.3, netProfit: 3.2, pb: 0.8,
          macd: '金叉', kdj: '拐头向上', bigOrderNet: 1.5
        },
        {
          code: '000002', name: '万科A', price: 18.90, change: -0.15, changePercent: -0.79,
          revenue: 42.5, pe: 15.2, roe: 8.7, netProfit: 2.8, pb: 1.2,
          macd: '底背离', kdj: '金叉', bigOrderNet: -0.5
        },
        {
          code: '600036', name: '招商银行', price: 35.67, change: 1.23, changePercent: 3.57,
          revenue: 32.1, pe: 12.8, roe: 16.5, netProfit: 8.9, pb: 1.5,
          macd: '0轴金叉', kdj: '拐头向上', bigOrderNet: 2.8
        },
        {
          code: '000858', name: '五粮液', price: 128.45, change: 2.56, changePercent: 2.03,
          revenue: 55.2, pe: 25.6, roe: 18.9, netProfit: 12.5, pb: 4.2,
          macd: '金叉', kdj: '底背离', bigOrderNet: 3.2
        },
        {
          code: '600519', name: '贵州茅台', price: 1680.0, change: -28.5, changePercent: -1.67,
          revenue: 125.3, pe: 28.9, roe: 22.1, netProfit: 45.6, pb: 8.5,
          macd: '拐头向上', kdj: '金叉', bigOrderNet: 1.2
        }
      ]
    }
  },
  '/stock/detail': {
    code: 200,
    message: 'success',
    data: {
      code: '000001', name: '平安银行', fullName: '平安银行股份有限公司',
      industry: '银行', market: '深交所', price: 12.35, change: 0.25, changePercent: 2.07,
      volume: 125486300, turnover: 1548963200,
      fundamental: { revenue: 15.6, pe: 8.5, pb: 0.8, roe: 12.3, netProfit: 3.2, grossMargin: 35.2, debtRatio: 85.6 },
      technical: { macd: '金叉', kdj: '拐头向上', boll: '突破中轨', kPattern: '小阳星', ma: '股价站上5日线' },
      capital: { bigOrderNet: 1.5, bigOrderAmount: 2856, hkConnect: 1200 }
    }
  }
}

// Mock API 响应函数
function getMockResponse(url, params = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url === '/stock/filter/conditions') {
        resolve(mockData[url][params.category] || { code: 404, message: '分类不存在' })
      } else {
        resolve(mockData[url] || { code: 404, message: '接口不存在' })
      }
    }, 300) // 模拟300ms延迟
  })
}

// 拦截axios请求，返回Mock数据（开发环境使用）
export function setupMockInterceptor(service) {
  if (process.env.NODE_ENV === 'development') {
    service.interceptors.request.use(
      async (config) => {
        const mockResponse = await getMockResponse(config.url, config.params || config.data)
        return Promise.reject({ isMockData: true, data: mockResponse })
      },
      error => Promise.reject(error)
    )

    service.interceptors.response.use(
      response => response,
      error => error.isMockData ? Promise.resolve({ data: error.data }) : Promise.reject(error)
    )
  }
} 