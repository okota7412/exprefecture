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
import {
  authenticateToken,
  requireAuth,
  type AuthRequest,
} from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { validateUUIDParams } from '../middleware/validate-uuid.js'
import { accountGroupService } from '../services/account-group.service.js'

const router = express.Router()

/**
 * アカウントグループ一覧取得
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const accountGroups = await accountGroupService.getAccountGroupsByUserId(
      user.userId
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
    const user = requireAuth(req)
    const accountGroup = await accountGroupService.getPersonalAccountGroup(
      user.userId
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
    const user = requireAuth(req)
    const status = req.query.status as string | undefined
    const invitations = await accountGroupService.getInvitationsByInvitee(
      user.userId,
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
    const user = requireAuth(req)
    const validatedData = respondToInvitationSchema.parse(req.body)
    await accountGroupService.respondToInvitation(validatedData, user.userId)

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
    const user = requireAuth(req)
    const validatedData = createAccountGroupSchema.parse(req.body)
    const accountGroup = await accountGroupService.createAccountGroup(
      validatedData,
      user.userId
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const accountGroup = await accountGroupService.getAccountGroupById(
      id,
      user.userId
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const validatedData = updateAccountGroupSchema.parse(req.body)
    const accountGroup = await accountGroupService.updateAccountGroup(
      id,
      validatedData,
      user.userId
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    await accountGroupService.deleteAccountGroup(id, user.userId)
    res.status(204).send()
  })
)

/**
 * アカウントグループメンバー一覧取得
 */
router.get(
  '/:id/members',
  authenticateToken,
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const members = await accountGroupService.getMembers(id, user.userId)
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    await accountGroupService.leaveAccountGroup(id, user.userId)
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
  validateUUIDParams(['id', 'userId']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id, userId } = req.params
    await accountGroupService.removeMember(id, userId, user.userId)
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
  validateUUIDParams(['id']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = requireAuth(req)
    const { id } = req.params
    const validatedData = sendInvitationSchema.parse(req.body)
    const invitation = await accountGroupService.sendInvitation(
      id,
      validatedData,
      user.userId
    )

    res.status(201).json(invitation)
  })
)

export default router
