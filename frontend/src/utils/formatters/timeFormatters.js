/**
 * 时间格式化工具函数
 */

/**
 * 时间格式化函数
 * 支持的占位符：{y}年 {m}月 {d}日 {h}时 {i}分 {s}秒 {a}上午/下午
 * @param {Date|string|number} time - 时间对象、时间字符串或时间戳
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的时间字符串
 */
export const parseTime = (time, format = '{y}-{m}-{d} {h}:{i}') => {
  if (!time) return ''
  
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (('' + time).length === 10) time = parseInt(time) * 1000
    date = new Date(time)
  }
  
  if (!date || date.toUTCString() === 'Invalid Date') {
    return ''
  }
  
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getHours() > 11 ? '下午' : '上午'
  }
  
  const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
    const value = formatObj[key]
    // 注意：getMonth() 返回的是 0-11，所以需要加 1
    // 前面已经加了，这里需要确保两位数
    if (key === 'm' || key === 'd' || key === 'h' || key === 'i' || key === 's') {
      return ('' + value).padStart(2, '0')
    }
    return value || 0
  })
  
  return time_str
}

/**
 * 获取相对时间
 * 例如：刚刚、5分钟前、1小时前、昨天、3天前、一个月前、一年前
 * @param {Date|string|number} time - 时间对象、时间字符串或时间戳
 * @returns {string} 相对时间字符串
 */
export const getRelativeTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  // 计算时间差的秒数、分钟数、小时数、天数、月数、年数
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  
  if (years > 0) {
    return `${years}年前`
  } else if (months > 0) {
    return `${months}个月前`
  } else if (days > 7) {
    return `${days}天前`
  } else if (days > 0) {
    return days === 1 ? '昨天' : `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 获取日期范围内的所有日期
 * @param {Date} start - 开始日期
 * @param {Date} end - 结束日期
 * @returns {Array<Date>} 日期数组
 */
export const getDateRange = (start, end) => {
  const dateArray = []
  let currentDate = new Date(start)
  const endDate = new Date(end)
  
  while (currentDate <= endDate) {
    dateArray.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dateArray
}

/**
 * 获取当前月份的第一天
 * @returns {Date} 日期对象
 */
export const getFirstDayOfMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

/**
 * 获取当前月份的最后一天
 * @returns {Date} 日期对象
 */
export const getLastDayOfMonth = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
}