/**
 * リクエスト関連のユーティリティ
 */
import type { Request } from 'express'

/**
 * IPアドレスを取得
 * プロキシ経由の場合はX-Forwarded-Forヘッダーを考慮
 */
export const getClientIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || undefined
}

/**
 * User-Agentを取得
 */
export const getUserAgent = (req: Request): string | undefined => {
  return req.headers['user-agent']
}

/**
 * accountGroupIdをリクエストから取得
 * bodyまたはqueryパラメータから取得を試みる
 */
export const getAccountGroupId = (req: Request): string | undefined => {
  return (
    (req.body?.accountGroupId as string | undefined) ||
    (req.query.accountGroupId as string | undefined)
  )
}
