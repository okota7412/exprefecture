/**
 * エラーハンドリングユーティリティ
 * 統一されたエラーハンドリングを提供
 */
import type { Response } from 'express'
import { z } from 'zod'

import { error as logError } from './logger.js'

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly errors?: z.ZodError['errors']
  ) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND')
  }
}

/**
 * 競合エラー
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends AppError {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

/**
 * サービス層のエラーをAppErrorに変換
 */
export const mapServiceError = (error: unknown): AppError => {
  // 既にAppErrorの場合はそのまま返す
  if (error instanceof AppError) {
    return error
  }

  // ZodErrorの場合はValidationErrorに変換
  if (error instanceof z.ZodError) {
    return new ValidationError('Validation error', error.errors)
  }

  // サービス層のカスタムエラーをチェック
  if (error instanceof Error) {
    // AuthError
    if (error.name === 'AuthError' && 'code' in error) {
      const code = (error as { code: string }).code
      if (code === 'INVALID_CREDENTIALS' || code === 'INVALID_TOKEN') {
        return new AuthenticationError(error.message)
      }
      if (code === 'EMAIL_EXISTS') {
        return new ConflictError(error.message)
      }
    }

    // ItemError, GroupError, AccountGroupError
    if (
      (error.name === 'ItemError' ||
        error.name === 'GroupError' ||
        error.name === 'AccountGroupError') &&
      'code' in error
    ) {
      const code = (error as { code: string }).code
      if (
        code === 'NOT_FOUND' ||
        code === 'ITEM_NOT_FOUND' ||
        code === 'GROUP_NOT_FOUND' ||
        code === 'ACCOUNT_GROUP_NOT_FOUND' ||
        code === 'INVITATION_NOT_FOUND' ||
        code === 'USER_NOT_FOUND'
      ) {
        return new NotFoundError(error.message)
      }
      if (code === 'FORBIDDEN') {
        return new AuthorizationError(error.message)
      }
      if (code === 'VALIDATION_ERROR') {
        return new ValidationError(error.message)
      }
    }
  }

  // 未知のエラーは500エラーとして扱う
  return new AppError('Internal server error', 500, 'INTERNAL_ERROR', false)
}

/**
 * エラーレスポンスを送信
 */
export const sendErrorResponse = (
  res: Response,
  error: AppError,
  includeStack = false
): void => {
  const response: {
    message: string
    code: string
    errors?: unknown
    retryAfter?: number
    stack?: string
  } = {
    message: error.message,
    code: error.code,
  }

  if (error instanceof ValidationError && error.errors) {
    response.errors = error.errors
  }

  if (error instanceof RateLimitError && error.retryAfter) {
    response.retryAfter = error.retryAfter
  }

  if (includeStack && process.env.NODE_ENV !== 'production') {
    response.stack = error.stack
  }

  res.status(error.statusCode).json(response)
}

/**
 * エラーハンドリングミドルウェア
 */
export const errorHandler = (
  error: unknown,
  res: Response,
  context?: string
): void => {
  const appError = mapServiceError(error)

  // エラーログを出力
  if (!appError.isOperational) {
    const errorDetails: Record<string, unknown> = {
      error: error instanceof Error ? error.message : String(error),
    }
    if (error instanceof Error && error.stack) {
      errorDetails.stack = error.stack
    }
    logError('Unhandled error', context, errorDetails)
  } else {
    logError('Operational error', context, {
      message: appError.message,
      code: appError.code,
    })
  }

  // エラーレスポンスを送信
  sendErrorResponse(res, appError, process.env.NODE_ENV !== 'production')
}
