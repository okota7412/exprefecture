/**
 * Rate Limiting ミドルウェア
 * ブルートフォース対策
 */
import type { Request, Response } from 'express'

/**
 * シンプルなメモリベースのRate Limiter
 * 本番環境ではRedis等の外部ストアを使用することを推奨
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * クリーンアップ: 期限切れのエントリを削除
 */
const cleanup = () => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// 5分ごとにクリーンアップ
setInterval(cleanup, 5 * 60 * 1000)

/**
 * 開発環境用: レート制限ストアをクリアする関数
 */
export const clearRateLimitStore = () => {
  rateLimitStore.clear()
  console.log('Rate limit store cleared')
}

export interface RateLimitOptions {
  windowMs: number // 時間窓（ミリ秒）
  maxRequests: number // 最大リクエスト数
  keyGenerator?: (req: Request) => string // キー生成関数（デフォルト: IPアドレス）
  message?: string // エラーメッセージ
  skipSuccessfulRequests?: boolean // 成功したリクエストをカウントしない
}

/**
 * Rate Limiting ミドルウェアを生成
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    keyGenerator = (req: Request) => {
      // IPアドレスを取得（プロキシ経由の場合はX-Forwarded-Forヘッダーを考慮）
      const forwarded = req.headers['x-forwarded-for']
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim()
      }
      return req.ip || req.socket.remoteAddress || 'unknown'
    },
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    windowMs,
  } = options

  return (req: Request, res: Response, next: () => void) => {
    const key = keyGenerator(req)
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetTime < now) {
      // 新しい時間窓を開始
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return next()
    }

    if (entry.count >= maxRequests) {
      // レート制限に達した
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000)
      res.status(429).json({
        message,
        retryAfter: resetTimeSeconds,
      })
      return
    }

    // カウントを増やす
    entry.count++

    // レスポンスが成功した場合のみカウントする場合
    if (skipSuccessfulRequests) {
      const originalSend = res.send
      res.send = function (body) {
        if (res.statusCode < 400) {
          entry.count--
        }
        return originalSend.call(this, body)
      }
    }

    next()
  }
}

/**
 * ログイン用のRate Limiter
 * 開発環境: 20回/15分
 * 本番環境: 5回/15分
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: process.env.NODE_ENV === 'production' ? 5 : 20, // 本番: 5回、開発: 20回
  message: 'Too many login attempts, please try again later',
})

/**
 * サインアップ用のRate Limiter
 * 開発環境: 10回/15分
 * 本番環境: 3回/時間
 */
export const signupRateLimiter = createRateLimiter({
  windowMs:
    process.env.NODE_ENV === 'production'
      ? 60 * 60 * 1000 // 本番: 1時間
      : 15 * 60 * 1000, // 開発: 15分
  maxRequests: process.env.NODE_ENV === 'production' ? 3 : 10, // 本番: 3回、開発: 10回
  message: 'Too many signup attempts, please try again later',
})
