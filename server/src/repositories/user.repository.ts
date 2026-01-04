/**
 * ユーザーリポジトリ（データアクセス層）
 */
import type { AuthUser } from '../types/auth.js'
import prisma from '../utils/prisma.js'

export interface UserWithPasswordHash extends AuthUser {
  passwordHash: string
}

export interface IUserRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  findByEmailWithPassword(email: string): Promise<UserWithPasswordHash | null>
  findById(id: string): Promise<AuthUser | null>
  create(data: {
    email: string
    passwordHash: string
    role: string
  }): Promise<AuthUser>
  existsByEmail(email: string): Promise<boolean>
}

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  async findByEmailWithPassword(
    email: string
  ): Promise<UserWithPasswordHash | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  async create(data: {
    email: string
    passwordHash: string
    role: string
  }): Promise<AuthUser> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      },
    })

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    })
    return count > 0
  }
}

export const userRepository = new UserRepository()
