import { PrismaClient } from '@prisma/client'

// Prismaクライアントのシングルトンインスタンス
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

// 開発環境でのホットリロード時の重複インスタンス化を防ぐ
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// アプリケーション終了時のクリーンアップ
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
