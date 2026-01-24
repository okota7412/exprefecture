import type { Request, Response, NextFunction } from 'express'

import { AuthenticationError } from '../utils/error-handler.js'
import { verifyAccessToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  user: {
    userId: string
    role: string
  }
}

/**
 * 認証トークンを検証するミドルウェア
 * 認証に成功した場合、req.userにユーザー情報を設定する
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' })
    return
  }

  try {
    const decoded = verifyAccessToken(token)
    ;(req as AuthRequest).user = {
      userId: decoded.userId,
      role: decoded.role,
    }
    next()
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' })
  }
}

/**
 * 認証済みユーザーが存在することを保証するヘルパー関数
 * この関数は認証ミドルウェアの後に使用することを想定
 */
export const requireAuth = (req: Request): AuthRequest['user'] => {
  const authReq = req as AuthRequest
  if (!authReq.user) {
    throw new AuthenticationError('User not authenticated')
  }
  return authReq.user
}
