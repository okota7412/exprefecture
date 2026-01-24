/**
 * グループルーター（コントローラー層）
 */
import express, { type Response } from 'express'

import { createGroupSchema, updateGroupSchema } from '../dto/group.dto.js'
import {
  authenticateToken,
  requireAuth,
  type AuthRequest,
} from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { validateUUIDParams } from '../middleware/validate-uuid.js'
import { groupService } from '../services/group.service.js'
import { ValidationError } from '../utils/error-handler.js'
import { getAccountGroupId } from '../utils/request.js'

const router = express.Router()

/**
 * グループ一覧取得
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const accountGroupId = getAccountGroupId(req)
    const groups = await groupService.getGroupsByUserId(
      user.userId,
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
    const user = requireAuth(req)
    const validatedData = createGroupSchema.parse(req.body)
    const accountGroupId = getAccountGroupId(req)

    if (!accountGroupId) {
      throw new ValidationError('accountGroupId is required')
    }

    const group = await groupService.createGroup(
      validatedData,
      user.userId,
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const accountGroupId = getAccountGroupId(req)
    const group = await groupService.getGroupById(
      id,
      user.userId,
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const validatedData = updateGroupSchema.parse(req.body)
    const accountGroupId = getAccountGroupId(req)
    const group = await groupService.updateGroup(
      id,
      validatedData,
      user.userId,
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const accountGroupId = getAccountGroupId(req)
    await groupService.deleteGroup(id, user.userId, accountGroupId)
    res.status(204).send()
  })
)

export default router
