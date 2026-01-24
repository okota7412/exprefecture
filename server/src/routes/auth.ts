/**
 * 認証ルーター（コントローラー層）
 */
import express, { type Request, type Response } from 'express'

import { loginSchema, signupSchema } from '../dto/auth.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken, getCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import {
  loginRateLimiter,
  signupRateLimiter,
} from '../middleware/rate-limit.js'
import { authService } from '../services/auth.service.js'
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '../utils/cookie.js'
import { AuthenticationError, NotFoundError } from '../utils/error-handler.js'
import { error as logError } from '../utils/logger.js'
import { getClientIp, getUserAgent } from '../utils/request.js'

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
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = signupSchema.parse(req.body)
    const ipAddress = getClientIp(req)
    const userAgent = getUserAgent(req)
    const result = await authService.signup(validatedData, ipAddress, userAgent)

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
  })
)

/**
 * ログイン
 */
router.post(
  '/login',
  loginRateLimiter,
  verifyCsrfToken,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body)
    const ipAddress = getClientIp(req)
    const userAgent = getUserAgent(req)
    const result = await authService.login(validatedData, ipAddress, userAgent)

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
  })
)

/**
 * トークンリフレッシュ
 */
router.post(
  '/refresh',
  verifyCsrfToken,
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    if (!refreshToken) {
      throw new AuthenticationError('No refresh token provided')
    }

    try {
      const ipAddress = getClientIp(req)
      const userAgent = getUserAgent(req)
      const result = await authService.refresh(
        refreshToken,
        ipAddress,
        userAgent
      )
      res.json(result)
    } catch (error) {
      // エラーが発生した場合はCookieをクリア
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      throw error
    }
  })
)

/**
 * 現在のユーザー情報を取得
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getUserById(req.user.userId)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    res.json({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
  })
)

/**
 * ログアウト
 */
router.post(
  '/logout',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME]

    try {
      if (refreshToken) {
        const ipAddress = getClientIp(req)
        const userAgent = getUserAgent(req)
        await authService.logout(
          refreshToken,
          req.user.userId,
          ipAddress,
          userAgent
        )
      }
    } catch (error) {
      // エラーが発生してもCookieはクリア（ログアウトは常に成功として扱う）
      // エラーはログに記録するが、レスポンスには影響しない
      logError('Logout error (non-fatal)', 'Auth Route', error)
    } finally {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_OPTIONS)
      res.json({ message: 'Logged out successfully' })
    }
  })
)

export default router
