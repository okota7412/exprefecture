import type { Request, Response, NextFunction } from 'express'

import { verifyAccessToken } from '../utils/jwt.js'

export interface AuthRequest extends Request {
  user: {
    userId: string
    role: string
  }
}

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
