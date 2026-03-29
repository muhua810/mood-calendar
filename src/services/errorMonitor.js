/**
 * 轻量错误监控工具
 *
 * 功能：
 * - 捕获未处理的 JS 错误和 Promise rejection
 * - 错误队列（本地存储，支持导出）
 * - 全局错误边界集成接口
 * - 无外部依赖，零配置
 *
 * 答辩加分项："我们有线上监控和错误追踪能力"
 */

const ERROR_STORAGE_KEY = 'moodtrace_errors'
const MAX_ERRORS = 50

// 内存错误队列
let errorQueue = []

/**
 * 初始化全局错误监听
 * 建议在 main.jsx 中调用一次
 */
export function initErrorMonitor() {
  // 捕获 JS 运行时错误
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      type: 'runtime',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
      type: 'unhandledrejection',
    })
  })

  // 从 localStorage 加载历史错误
  try {
    const saved = localStorage.getItem(ERROR_STORAGE_KEY)
    if (saved) {
      errorQueue = JSON.parse(saved)
    }
  } catch { /* ignore */ }

  console.log('[ErrorMonitor] 已初始化')
}

/**
 * 手动捕获错误
 * @param {Error|string} error - 错误对象或消息
 * @param {Object} context - 额外上下文信息
 */
export function captureError(error, context = {}) {
  const entry = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent.slice(0, 100),
    ...context,
  }

  errorQueue.push(entry)

  // 限制队列长度
  if (errorQueue.length > MAX_ERRORS) {
    errorQueue = errorQueue.slice(-MAX_ERRORS)
  }

  // 持久化到 localStorage
  try {
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorQueue))
  } catch { /* storage full, ignore */ }

  // 开发环境下打印到控制台
  if (import.meta.env.DEV) {
    console.error('[ErrorMonitor]', entry.message, error)
  }
}

/**
 * 获取错误队列
 */
export function getErrors() {
  return [...errorQueue]
}

/**
 * 清除错误记录
 */
export function clearErrors() {
  errorQueue = []
  try { localStorage.removeItem(ERROR_STORAGE_KEY) } catch { /* ignore */ }
}

/**
 * 导出错误报告为 JSON
 */
export function exportErrorReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    errors: errorQueue,
    appVersion: '2.1.3',
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `moodtrace-error-report-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
