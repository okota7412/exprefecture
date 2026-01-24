/**
 * エラーハンドリングミドルウェア
 */
import type { Request, Response, NextFunction } from 'express'

import { errorHandler } from '../utils/error-handler.js'

/**
 * エラーハンドリングミドルウェア
 * Expressのエラーハンドリングミドルウェアとして使用
 */
export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  errorHandler(err, res, `${req.method} ${req.path}`)
}

/**
 * 非同期エラーハンドリングラッパー
 * 非同期ルートハンドラーでエラーを適切にキャッチする
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
