import type { Request, Response, NextFunction } from 'express'

import { verifyAccessToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    role: string
  }
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = { userId: decoded.userId, role: decoded.role }
    next()
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' })
  }
}
