/**
 * 認証関連の型定義
 */

export interface TokenPayload {
  userId: string
  role: string
}

export interface AuthUser {
  id: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface RefreshTokenData {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: {
    userId: string
    email: string
    role: string
  }
}

export interface SignupResult {
  accessToken: string
  refreshToken: string
  user: {
    userId: string
    email: string
    role: string
  }
}
