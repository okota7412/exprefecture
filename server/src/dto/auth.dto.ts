/**
 * 認証関連のDTOとバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * ログインリクエストDTO
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginDto = z.infer<typeof loginSchema>

/**
 * サインアップリクエストDTO
 */
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type SignupDto = z.infer<typeof signupSchema>

/**
 * エラーレスポンスDTO
 */
export interface ErrorResponse {
  message: string
  errors?: z.ZodError['errors']
}

/**
 * 認証成功レスポンスDTO
 */
export interface AuthSuccessResponse {
  accessToken: string
  user: {
    userId: string
    email: string
    role: string
  }
}

/**
 * トークンリフレッシュレスポンスDTO
 */
export interface RefreshTokenResponse {
  accessToken: string
}
