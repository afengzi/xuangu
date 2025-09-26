// 从共享核心实现导出，避免重复代码
// 依赖在 index.html 中预先注入的 shared/utils/themesCache.core.js

function ensureFactory() {
  if (typeof window === 'undefined' || !window.ThemesCacheFactory) {
    throw new Error('themesCache.core.js 未加载：请在 index.html 注入共享脚本')
  }
  return window.ThemesCacheFactory()
}

export const themesCache = ensureFactory().themesCache
export const getThemesData = ensureFactory().getThemesData
export const preloadThemesData = ensureFactory().preloadThemesData
export const refreshThemesData = ensureFactory().refreshThemesData
export const forceRefreshThemesData = ensureFactory().forceRefreshThemesData
export const getThemesCacheInfo = ensureFactory().getThemesCacheInfo
