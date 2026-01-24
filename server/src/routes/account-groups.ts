/**
 * アカウントグループルーター（コントローラー層）
 */
import express, { type Response } from 'express'

import {
  createAccountGroupSchema,
  respondToInvitationSchema,
  sendInvitationSchema,
  updateAccountGroupSchema,
} from '../dto/account-group.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { accountGroupService } from '../services/account-group.service.js'
import { ValidationError } from '../utils/error-handler.js'
import { isValidUUID } from '../utils/validation.js'

const router = express.Router()

/**
 * アカウントグループ一覧取得
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const accountGroups = await accountGroupService.getAccountGroupsByUserId(
      req.user.userId
    )
    res.json(accountGroups)
  })
)

/**
 * 個人用アカウントグループ取得
 */
router.get(
  '/personal',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const accountGroup = await accountGroupService.getPersonalAccountGroup(
      req.user.userId
    )
    res.json(accountGroup)
  })
)

/**
 * 招待一覧取得（自分宛ての招待）
 * 注意: /:id より前に定義する必要がある
 */
router.get(
  '/invitations',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const status = req.query.status as string | undefined
    const invitations = await accountGroupService.getInvitationsByInvitee(
      req.user.userId,
      status
    )
    res.json(invitations)
  })
)

/**
 * 招待への応答（承諾/拒否）
 * 注意: /:id より前に定義する必要がある
 */
router.post(
  '/invitations/respond',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const validatedData = respondToInvitationSchema.parse(req.body)
    await accountGroupService.respondToInvitation(
      validatedData,
      req.user.userId
    )

    res.status(200).json({ message: 'Invitation responded successfully' })
  })
)

/**
 * アカウントグループ作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const validatedData = createAccountGroupSchema.parse(req.body)
    const accountGroup = await accountGroupService.createAccountGroup(
      validatedData,
      req.user.userId
    )

    res.status(201).json(accountGroup)
  })
)

/**
 * アカウントグループ詳細取得
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
      throw new ValidationError('Invalid account group ID format')
    }

    const accountGroup = await accountGroupService.getAccountGroupById(
      id,
      req.user.userId
    )
    res.json(accountGroup)
  })
)

/**
 * アカウントグループ更新
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
      throw new ValidationError('Invalid account group ID format')
    }

    const validatedData = updateAccountGroupSchema.parse(req.body)
    const accountGroup = await accountGroupService.updateAccountGroup(
      id,
      validatedData,
      req.user.userId
    )

    res.json(accountGroup)
  })
)

/**
 * アカウントグループ削除
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
      throw new ValidationError('Invalid account group ID format')
    }

    await accountGroupService.deleteAccountGroup(id, req.user.userId)
    res.status(204).send()
  })
)

/**
 * アカウントグループメンバー一覧取得
 */
router.get(
  '/:id/members',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid account group ID format')
    }

    const members = await accountGroupService.getMembers(id, req.user.userId)
    res.json(members)
  })
)

/**
 * アカウントグループから退会
 */
router.post(
  '/:id/leave',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid account group ID format')
    }

    await accountGroupService.leaveAccountGroup(id, req.user.userId)
    res.status(200).json({ message: 'Successfully left the account group' })
  })
)

/**
 * アカウントグループメンバー削除
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id, userId } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid account group ID format')
    }
    if (!isValidUUID(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    await accountGroupService.removeMember(id, userId, req.user.userId)
    res.status(204).send()
  })
)

/**
 * 招待送信
 */
router.post(
  '/:id/invitations',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid account group ID format')
    }

    const validatedData = sendInvitationSchema.parse(req.body)
    const invitation = await accountGroupService.sendInvitation(
      id,
      validatedData,
      req.user.userId
    )

    res.status(201).json(invitation)
  })
)

export default router
