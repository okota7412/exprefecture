/**
 * CSRF対策ミドルウェア
 * Double Submit Cookie パターンを実装
 */
import crypto from 'crypto'

import type { Request, Response, NextFunction } from 'express'

const CSRF_TOKEN_COOKIE_NAME = 'csrf-token'
const CSRF_TOKEN_HEADER_NAME = 'x-csrf-token'

/**
 * CSRFトークンを生成
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * CSRFトークンをCookieに設定
 */
export const setCsrfTokenCookie = (res: Response, token: string): void => {
  res.cookie(CSRF_TOKEN_COOKIE_NAME, token, {
    httpOnly: false, // JavaScriptからアクセス可能（Double Submit Cookieのため）
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24時間
  })
}

/**
 * CSRFトークンを検証
 * Double Submit Cookie: Cookieとヘッダーのトークンが一致することを確認
 */
export const verifyCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // GET, HEAD, OPTIONSはCSRF検証をスキップ（安全なメソッド）
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const cookieToken = req.cookies[CSRF_TOKEN_COOKIE_NAME]
  const headerToken = req.headers[CSRF_TOKEN_HEADER_NAME]

  // Cookieにトークンがない場合は生成して設定
  if (!cookieToken) {
    const newToken = generateCsrfToken()
    setCsrfTokenCookie(res, newToken)
    // 初回リクエストの場合は許可（トークンが設定される前のリクエスト）
    return next()
  }

  // ヘッダーにトークンがない、または一致しない場合は拒否
  if (!headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      message: 'Invalid CSRF token',
    })
    return
  }

  next()
}

/**
 * CSRFトークンを取得するエンドポイント用ミドルウェア
 * トークンを生成してCookieとレスポンスに含める
 */
export const getCsrfToken = (
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const token = req.cookies[CSRF_TOKEN_COOKIE_NAME] || generateCsrfToken()
  setCsrfTokenCookie(res, token)
  res.json({ csrfToken: token })
}
