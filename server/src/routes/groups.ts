/**
 * グループルーター（コントローラー層）
 */
import express, { type Response } from 'express'

import { createGroupSchema, updateGroupSchema } from '../dto/group.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { groupService } from '../services/group.service.js'
import { ValidationError } from '../utils/error-handler.js'
import { isValidUUID } from '../utils/validation.js'

const router = express.Router()

/**
 * グループ一覧取得
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const accountGroupId = req.query.accountGroupId as string | undefined
    const groups = await groupService.getGroupsByUserId(
      req.user.userId,
      accountGroupId
    )
    res.json(groups)
  })
)

/**
 * グループ作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const validatedData = createGroupSchema.parse(req.body)
    const accountGroupId =
      req.body.accountGroupId || (req.query.accountGroupId as string)

    if (!accountGroupId) {
      throw new ValidationError('accountGroupId is required')
    }

    const group = await groupService.createGroup(
      validatedData,
      req.user.userId,
      accountGroupId
    )

    res.status(201).json(group)
  })
)

/**
 * グループ詳細取得
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid group ID format')
    }

    const accountGroupId = req.query.accountGroupId as string | undefined
    const group = await groupService.getGroupById(
      id,
      req.user.userId,
      accountGroupId
    )
    res.json(group)
  })
)

/**
 * グループ更新
 */
router.patch(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid group ID format')
    }

    const validatedData = updateGroupSchema.parse(req.body)
    const accountGroupId =
      req.body.accountGroupId ||
      (req.query.accountGroupId as string | undefined)
    const group = await groupService.updateGroup(
      id,
      validatedData,
      req.user.userId,
      accountGroupId
    )

    res.json(group)
  })
)

/**
 * グループ削除
 */
router.delete(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid group ID format')
    }

    const accountGroupId = req.query.accountGroupId as string | undefined
    await groupService.deleteGroup(id, req.user.userId, accountGroupId)
    res.status(204).send()
  })
)

export default router
