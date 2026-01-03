import bcrypt from 'bcryptjs'
import express, { type Request, type Response } from 'express'
import { z } from 'zod'

import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import prisma from '../utils/prisma.js'

const router = express.Router()

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Cookie設定の共通化
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
}

/**
 * サインアップ（新規登録）
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const validatedData = signupSchema.parse(req.body)
    const { email, password } = validatedData

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10)

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'user',
      },
    })

    // トークンを生成
    const payload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // リフレッシュトークンをデータベースに保存
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7日後

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // リフレッシュトークンはHttpOnly Cookieへ
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    // アクセストークンはJSONでクライアントへ
    res.status(201).json({
      accessToken,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      })
    }

    // Prismaエラーの処理
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: unknown }
      if (prismaError.code === 'P2002') {
        return res.status(409).json({ message: 'Email already registered' })
      }
    }

    console.error('Signup error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * ログイン
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body)
    const { email, password } = validatedData

    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // パスワードを検証
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // トークンを生成
    const payload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // 古いリフレッシュトークンを削除（オプション：セキュリティ強化のため）
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    })

    // 新しいリフレッシュトークンをデータベースに保存
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7日後

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // リフレッシュトークンはHttpOnly Cookieへ
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    // アクセストークンはJSONでクライアントへ
    res.json({
      accessToken,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      })
    }

    console.error('Login error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * トークンリフレッシュ
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' })
  }

  try {
    // リフレッシュトークンの署名検証
    const decoded = verifyRefreshToken(refreshToken)

    // データベース上のリフレッシュトークンの有効性チェック
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // トークンが無効または期限切れ
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.userId },
      })
      res.clearCookie('refreshToken', COOKIE_OPTIONS)
      return res
        .status(403)
        .json({ message: 'Invalid or expired refresh token' })
    }

    // 新しいアクセストークンを生成
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
    })

    res.json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.clearCookie('refreshToken', COOKIE_OPTIONS)

    // データベースエラーの場合も適切に処理
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }
      if (prismaError.code === 'P2025') {
        // レコードが見つからない
        return res.status(403).json({ message: 'Invalid refresh token' })
      }
    }

    return res.status(403).json({ message: 'Invalid refresh token' })
  }
})

/**
 * 現在のユーザー情報を取得
 */
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

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

      // Prismaエラーの処理
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string }
        if (prismaError.code === 'P2025') {
          return res.status(404).json({ message: 'User not found' })
        }
      }

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
  async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies.refreshToken

    try {
      // データベースからリフレッシュトークンを削除
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: {
            userId: req.user!.userId,
            token: refreshToken,
          },
        })
      }

      // Cookieをクリア
      res.clearCookie('refreshToken', COOKIE_OPTIONS)
      res.json({ message: 'Logged out successfully' })
    } catch (error) {
      console.error('Logout error:', error)
      // エラーが発生してもCookieはクリア
      res.clearCookie('refreshToken', COOKIE_OPTIONS)
      res.json({ message: 'Logged out successfully' })
    }
  }
)

export default router
