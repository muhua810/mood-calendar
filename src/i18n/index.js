/**
 * 心迹 MoodTrace — i18n 工具模块
 * 轻量级国际化方案，零依赖
 */

import translations from './translations.js'

const STORAGE_KEY = 'moodtrace_lang'
const DEFAULT_LANG = 'zh'

/**
 * 获取当前语言
 */
export function getCurrentLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

/**
 * 设置当前语言
 */
export function setCurrentLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // localStorage 不可用时静默失败
  }
}

/**
 * 翻译函数
 * @param {string} key — 翻译键名，如 'nav.home'
 * @returns {string} 当前语言对应的文本，找不到则返回 key 本身
 */
export function t(key) {
  const lang = getCurrentLang()
  const dict = translations[lang] || translations[DEFAULT_LANG]
  return dict[key] || translations[DEFAULT_LANG]?.[key] || key
}

/**
 * 根据当前语言格式化日期
 * 中文环境输出 "2024年03月15日"，其他语言输出 "03/15/2024" 或 "15/03/2024"
 */
export function formatDateLocalized(date, pattern) {
  const lang = getCurrentLang()
  if (lang === 'zh') {
    // 中文：直接拼接
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}年${m}月${d}日`
  }
  // 其他语言：用英文格式
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const m = date.getMonth()
  const d = date.getDate()
  const y = date.getFullYear()
  if (pattern === 'M月d日' || pattern === 'short') return `${months[m]} ${d}`
  return `${months[m]} ${d}, ${y}`
}

/**
 * 根据当前语言生成月度标签
 * 中文: "2024年3月", 其他: "Mar 2024"
 */
export function formatMonthLabel(year, month) {
  const lang = getCurrentLang()
  if (lang === 'zh') return `${year}年${month}月`
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[month - 1]} ${year}`
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLangs() {
  return [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
  ]
}
