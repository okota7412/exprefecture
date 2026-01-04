/**
 * 認証ルーター（コントローラー層）
 */
import express, { type Request, type Response } from 'express'
import { z } from 'zod'

import { loginSchema, signupSchema } from '../dto/auth.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken, getCsrfToken } from '../middleware/csrf.js'
import {
  loginRateLimiter,
  signupRateLimiter,
} from '../middleware/rate-limit.js'
import { authService, AuthError } from '../services/auth.service.js'
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '../utils/cookie.js'

const router = express.Router()

/**
 * CSRFトークン取得エンドポイント
 */
router.get('/csrf-token', getCsrfToken)

/**
 * サインアップ（新規登録）
 */
router.post(
  '/signup',
  signupRateLimiter,
  verifyCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const validatedData = signupSchema.parse(req.body)
      const ipAddress = req.ip || req.socket.remoteAddress || undefined
      const userAgent = req.headers['user-agent']
      const result = await authService.signup(
        validatedData,
        ipAddress,
        userAgent
      )

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      )

      res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof AuthError) {
        const statusCode =
          error.code === 'EMAIL_EXISTS'
            ? 409
            : error.code === 'INVALID_CREDENTIALS'
              ? 401
              : 400
        return res.status(statusCode).json({ message: error.message })
      }

      console.error('Signup error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * ログイン
 */
router.post(
  '/login',
  loginRateLimiter,
  verifyCsrfToken,
  async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body)
      const ipAddress = req.ip || req.socket.remoteAddress || undefined
      const userAgent = req.headers['user-agent']
      const result = await authService.login(
        validatedData,
        ipAddress,
        userAgent
      )

      // リフレッシュトークンをHttpOnly Cookieに設定
      res.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS
      )

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof AuthError) {
        return res.status(401).json({ message: error.message })
      }

      console.error('Login error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * トークンリフレッシュ
 */
router.post(
  '/refresh',
  verifyCsrfToken,
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' })
    }

    try {
      const ipAddress = req.ip || req.socket.remoteAddress || undefined
      const userAgent = req.headers['user-agent']
      const result = await authService.refresh(
        refreshToken,
        ipAddress,
        userAgent
      )
      res.json(result)
    } catch (error) {
      if (error instanceof AuthError) {
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
        return res.status(403).json({ message: error.message })
      }

      console.error('Refresh error:', error)
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * 現在のユーザー情報を取得
 */
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await authService.getUserById(req.user!.userId)

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      res.json({
        userId: user.id,
        email: user.email,
        role: user.role,
      })
    } catch (error) {
      console.error('Get user error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * ログアウト
 */
router.post(
  '/logout',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    try {
      if (refreshToken) {
        const ipAddress = req.ip || req.socket.remoteAddress || undefined
        const userAgent = req.headers['user-agent']
        await authService.logout(
          refreshToken,
          req.user!.userId,
          ipAddress,
          userAgent
        )
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      res.json({ message: 'Logged out successfully' })
    } catch (error) {
      console.error('Logout error:', error)
      // エラーが発生してもCookieはクリア
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      res.json({ message: 'Logged out successfully' })
    }
  }
)

export default router
