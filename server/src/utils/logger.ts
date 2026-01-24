/**
 * ロガーユーティリティ
 * 開発環境と本番環境で適切にログを出力
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

const isDevelopment = process.env.NODE_ENV !== 'production'

/**
 * ログを出力
 */
const log = (
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown
) => {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }

  if (isDevelopment) {
    // 開発環境: 詳細なログを出力
    const prefix = context ? `[${context}]` : ''
    const logMessage = `${prefix} ${message}`

    switch (level) {
      case 'debug':
        console.log(logMessage, data || '')
        break
      case 'info':
        console.log(logMessage, data || '')
        break
      case 'warn':
        console.warn(logMessage, data || '')
        break
      case 'error':
        console.error(logMessage, data || '')
        break
    }
  } else {
    // 本番環境: 構造化ログ（JSON形式）
    console.log(JSON.stringify(entry))
  }
}

/**
 * デバッグログ（開発環境のみ）
 */
export const debug = (message: string, context?: string, data?: unknown) => {
  if (isDevelopment) {
    log('debug', message, context, data)
  }
}

/**
 * 情報ログ
 */
export const info = (message: string, context?: string, data?: unknown) => {
  log('info', message, context, data)
}

/**
 * 警告ログ
 */
export const warn = (message: string, context?: string, data?: unknown) => {
  log('warn', message, context, data)
}

/**
 * エラーログ
 */
export const error = (message: string, context?: string, data?: unknown) => {
  log('error', message, context, data)
}
