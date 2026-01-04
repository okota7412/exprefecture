import jwt from 'jsonwebtoken'

// 環境変数を取得（実行時に評価）
const getAccessTokenSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET environment variable is not set')
  }
  return secret
}

const getRefreshTokenSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is not set')
  }
  return secret
}

interface TokenPayload {
  userId: string
  role: string
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getAccessTokenSecret(), {
    expiresIn: '15m', // 15分
  })
}

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getRefreshTokenSecret(), {
    expiresIn: '7d', // 7日間
  })
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as TokenPayload
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, getRefreshTokenSecret()) as TokenPayload
}
