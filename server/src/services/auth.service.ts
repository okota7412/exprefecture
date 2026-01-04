/**
 * 認証サービス（ビジネスロジック層）
 */
import type { LoginDto, SignupDto } from '../dto/auth.dto.js'
import { refreshTokenRepository } from '../repositories/refresh-token.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import type {
  LoginResult,
  SignupResult,
  TokenPayload,
  AuthUser,
} from '../types/auth.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'

import { auditLogService } from './audit-log.service.js'
import { passwordService } from './password.service.js'

/**
 * リフレッシュトークンの有効期限（日数）
 */
const REFRESH_TOKEN_EXPIRY_DAYS = 7

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_CREDENTIALS'
      | 'EMAIL_EXISTS'
      | 'USER_NOT_FOUND'
      | 'INVALID_TOKEN'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export interface IAuthService {
  signup(
    dto: SignupDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SignupResult>
  login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult>
  refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string }>
  logout(
    refreshToken: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void>
  getUserById(
    userId: string
  ): Promise<Omit<AuthUser, 'createdAt' | 'updatedAt'> | null>
}

export class AuthService implements IAuthService {
  async signup(
    dto: SignupDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SignupResult> {
    // メールアドレスの重複チェック
    const exists = await userRepository.existsByEmail(dto.email)
    if (exists) {
      throw new AuthError('Email already registered', 'EMAIL_EXISTS')
    }

    // パスワードをハッシュ化
    const passwordHash = await passwordService.hash(dto.password)

    // ユーザーを作成
    const user = await userRepository.create({
      email: dto.email,
      passwordHash,
      role: 'user',
    })

    // トークンを生成
    const payload: TokenPayload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // リフレッシュトークンの有効期限を設定
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    // リフレッシュトークンをデータベースに保存
    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    })

    // 監査ログ
    auditLogService.logSignup({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
    })

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    // ユーザーを取得（パスワードハッシュも含む）
    const user = await userRepository.findByEmailWithPassword(dto.email)

    // タイミング攻撃対策: ユーザーが存在しない場合でも同じ時間がかかるようにする
    // パスワードハッシュがnullの場合はダミーハッシュで検証
    const passwordHash = user?.passwordHash || null
    const isValidPassword = await passwordService.verifyWithTimingProtection(
      dto.password,
      passwordHash
    )

    // ユーザーが存在しない、またはパスワードが無効な場合
    if (!user || !isValidPassword) {
      // 監査ログ: ログイン失敗
      auditLogService.logLoginFailure({
        email: dto.email,
        ipAddress,
        userAgent,
        reason: !user ? 'user_not_found' : 'invalid_password',
      })
      // ユーザー列挙耐性: エラーメッセージとレスポンス時間を統一
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
    }

    // トークンを生成
    const payload: TokenPayload = { userId: user.id, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // 古いリフレッシュトークンを削除（セキュリティ強化）
    await refreshTokenRepository.deleteByUserId(user.id)

    // 新しいリフレッシュトークンをデータベースに保存
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    await refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
    })

    // 監査ログ: ログイン成功
    auditLogService.logLoginSuccess({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
    })

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string }> {
    // リフレッシュトークンの署名検証
    let decoded: TokenPayload
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch {
      auditLogService.logRefreshTokenFailed({
        ipAddress,
        userAgent,
        reason: 'invalid_signature',
      })
      throw new AuthError('Invalid or expired refresh token', 'INVALID_TOKEN')
    }

    // データベース上のリフレッシュトークンの有効性チェック
    const storedToken = await refreshTokenRepository.findByToken(refreshToken)

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // トークンが無効または期限切れ
      if (storedToken) {
        await refreshTokenRepository.deleteByUserId(decoded.userId)
      }
      auditLogService.logRefreshTokenFailed({
        ipAddress,
        userAgent,
        reason: !storedToken ? 'token_not_found' : 'token_expired',
      })
      throw new AuthError('Invalid or expired refresh token', 'INVALID_TOKEN')
    }

    // 新しいアクセストークンを生成
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
    })

    // 監査ログ
    auditLogService.logRefreshTokenUsed({
      userId: decoded.userId,
      ipAddress,
      userAgent,
    })

    return { accessToken: newAccessToken }
  }

  async logout(
    refreshToken: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // データベースからリフレッシュトークンを削除
    await refreshTokenRepository.deleteByToken(refreshToken)

    // 監査ログ
    const user = await userRepository.findById(userId)
    auditLogService.logLogout({
      userId,
      email: user?.email,
      ipAddress,
      userAgent,
    })
  }

  async getUserById(
    userId: string
  ): Promise<Omit<AuthUser, 'createdAt' | 'updatedAt'> | null> {
    const user = await userRepository.findById(userId)
    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  }
}

export const authService = new AuthService()
