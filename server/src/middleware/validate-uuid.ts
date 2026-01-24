/**
 * UUIDバリデーションミドルウェア
 */
import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '../utils/error-handler.js'
import { isValidUUID } from '../utils/validation.js'

/**
 * パラメータのUUIDをバリデーションするミドルウェア
 * @param paramNames バリデーションするパラメータ名の配列（デフォルト: ['id']）
 */
export const validateUUIDParams = (paramNames: string[] = ['id']) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const paramName of paramNames) {
      const value = req.params[paramName]
      if (value && !isValidUUID(value)) {
        throw new ValidationError(`Invalid ${paramName} format`)
      }
    }
    next()
  }
}
