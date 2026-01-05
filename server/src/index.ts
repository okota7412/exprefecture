import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import authRoutes from './routes/auth.js'
import itemRoutes from './routes/items.js'
import prisma from './utils/prisma.js'

const app = express()
const PORT = process.env.PORT || 8080

// 環境変数の確認
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error(
    'ERROR: ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set'
  )
  console.error('Please copy .env.example to .env and set the required values')
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
app.use('/api/items', itemRoutes)

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
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      message: 'Database connection failed',
    })
  }
})

// エラーハンドリングミドルウェア
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
)

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// グレースフルシャットダウン
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)

  server.close(async () => {
    console.log('HTTP server closed')

    try {
      await prisma.$disconnect()
      console.log('Database connection closed')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  })

  // 強制終了のタイムアウト（30秒）
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
