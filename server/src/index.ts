import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { errorHandlerMiddleware } from './middleware/error-handler.js'
import { clearRateLimitStore } from './middleware/rate-limit.js'
import accountGroupRoutes from './routes/account-groups.js'
import authRoutes from './routes/auth.js'
import groupRoutes from './routes/groups.js'
import itemRoutes from './routes/items.js'
import { info, error as logError } from './utils/logger.js'
import prisma from './utils/prisma.js'

const app = express()
const PORT = process.env.PORT || 8080

// 環境変数の確認
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  logError('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set', 'Server')
  logError(
    'Please copy .env.example to .env and set the required values',
    'Server'
  )
  process.exit(1)
}

// CORS設定（フロントエンドからのCookie送信を許可）
// 注意: CORSは他のミドルウェアより前に配置する必要がある
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // 開発環境では複数のオリジンを許可
    const isDevelopment = process.env.NODE_ENV !== 'production'
    const allowedOrigins = isDevelopment
      ? ['http://localhost:3000', 'http://localhost:5173']
      : process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : []

    // originがundefinedの場合は許可（Postmanなどからの直接リクエスト、またはプリフライトリクエスト）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  optionsSuccessStatus: 200, // 一部の古いブラウザ（IE11など）のサポート
}

app.use(cors(corsOptions))

// ミドルウェア
app.use(express.json())
app.use(cookieParser())

// ルート
app.use('/api/auth', authRoutes)
app.use('/api/account-groups', accountGroupRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/items', itemRoutes)

// 開発環境用: レート制限をクリアするエンドポイント
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/clear-rate-limit', (_req, res) => {
    clearRateLimitStore()
    res.json({ message: 'Rate limit store cleared' })
  })
}

// ヘルスチェック（データベース接続も確認）
app.get('/health', async (req, res) => {
  try {
    // データベース接続を確認
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    // エラーをログに記録
    const { error: logError } = await import('./utils/logger.js')
    logError('Health check failed', 'Health', error)
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      message: 'Database connection failed',
    })
  }
})

// エラーハンドリングミドルウェア（ルートの後に配置）
app.use(errorHandlerMiddleware)

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const server = app.listen(PORT, () => {
  info(`Server running on port ${PORT}`, 'Server')
  info(`Health check: http://localhost:${PORT}/health`, 'Server')
  info(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Server')
})

// グレースフルシャットダウン
const gracefulShutdown = async (signal: string) => {
  info(`${signal} received. Starting graceful shutdown...`, 'Server')

  server.close(async () => {
    info('HTTP server closed', 'Server')

    try {
      await prisma.$disconnect()
      info('Database connection closed', 'Server')
      process.exit(0)
    } catch (error) {
      logError('Error during shutdown', 'Server', error)
      process.exit(1)
    }
  })

  // 強制終了のタイムアウト（30秒）
  setTimeout(() => {
    logError('Forced shutdown after timeout', 'Server')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
