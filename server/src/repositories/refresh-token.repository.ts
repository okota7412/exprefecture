/**
 * リフレッシュトークンリポジトリ（データアクセス層）
 */
import type { RefreshTokenData } from '../types/auth.js'
import prisma from '../utils/prisma.js'

export interface IRefreshTokenRepository {
  create(data: {
    userId: string
    token: string
    expiresAt: Date
  }): Promise<RefreshTokenData>
  findByToken(
    token: string
  ): Promise<(RefreshTokenData & { user: { id: string; role: string } }) | null>
  deleteByToken(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpired(): Promise<number>
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: {
    userId: string
    token: string
    expiresAt: Date
  }): Promise<RefreshTokenData> {
    const token = await prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    })

    return {
      id: token.id,
      userId: token.userId,
      token: token.token,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    }
  }

  async findByToken(
    token: string
  ): Promise<
    (RefreshTokenData & { user: { id: string; role: string } }) | null
  > {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })

    if (!storedToken) {
      return null
    }

    return {
      id: storedToken.id,
      userId: storedToken.userId,
      token: storedToken.token,
      expiresAt: storedToken.expiresAt,
      createdAt: storedToken.createdAt,
      user: {
        id: storedToken.user.id,
        role: storedToken.user.role,
      },
    }
  }

  async deleteByToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    })
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    return result.count
  }
}

export const refreshTokenRepository = new RefreshTokenRepository()
