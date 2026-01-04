/**
 * Cookie設定の共通化
 */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'

/**
 * Refresh Token Cookie設定
 */
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
  path: '/',
}
