/**
 * アカウントグループルーター（コントローラー層）
 */
import express, { type Response } from 'express'
import { z } from 'zod'

import {
  createAccountGroupSchema,
  respondToInvitationSchema,
  sendInvitationSchema,
  updateAccountGroupSchema,
} from '../dto/account-group.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import {
  accountGroupService,
  AccountGroupError as ServiceAccountGroupError,
} from '../services/account-group.service.js'

const router = express.Router()

/**
 * アカウントグループ一覧取得
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const accountGroups = await accountGroupService.getAccountGroupsByUserId(
      req.user!.userId
    )
    res.json(accountGroups)
  } catch (error) {
    console.error('Get account groups error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * 個人用アカウントグループ取得
 */
router.get(
  '/personal',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const accountGroup = await accountGroupService.getPersonalAccountGroup(
        req.user!.userId
      )
      res.json(accountGroup)
    } catch (error) {
      console.error('Get personal account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * 招待一覧取得（自分宛ての招待）
 * 注意: /:id より前に定義する必要がある
 */
router.get(
  '/invitations',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const status = req.query.status as string | undefined
      const invitations = await accountGroupService.getInvitationsByInvitee(
        req.user!.userId,
        status
      )
      res.json(invitations)
    } catch (error) {
      console.error('Get invitations error:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack)
      }
      return res.status(500).json({
        message: 'Internal server error',
        error:
          process.env.NODE_ENV !== 'production' ? String(error) : undefined,
      })
    }
  }
)

/**
 * 招待への応答（承諾/拒否）
 * 注意: /:id より前に定義する必要がある
 */
router.post(
  '/invitations/respond',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = respondToInvitationSchema.parse(req.body)
      await accountGroupService.respondToInvitation(
        validatedData,
        req.user!.userId
      )

      res.status(200).json({ message: 'Invitation responded successfully' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'INVITATION_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'INVITATION_EXPIRED') {
          return res.status(400).json({ message: error.message })
        }
        if (error.code === 'INVALID_INVITATION_STATUS') {
          return res.status(400).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Respond to invitation error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループ作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createAccountGroupSchema.parse(req.body)
      const accountGroup = await accountGroupService.createAccountGroup(
        validatedData,
        req.user!.userId
      )

      res.status(201).json(accountGroup)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      console.error('Create account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループ詳細取得
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const accountGroup = await accountGroupService.getAccountGroupById(
        req.params.id,
        req.user!.userId
      )
      res.json(accountGroup)
    } catch (error) {
      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Get account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループ更新
 */
router.patch(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateAccountGroupSchema.parse(req.body)
      const accountGroup = await accountGroupService.updateAccountGroup(
        req.params.id,
        validatedData,
        req.user!.userId
      )

      res.json(accountGroup)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Update account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループ削除
 */
router.delete(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await accountGroupService.deleteAccountGroup(
        req.params.id,
        req.user!.userId
      )
      res.status(204).send()
    } catch (error) {
      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Delete account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループメンバー一覧取得
 */
router.get(
  '/:id/members',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const members = await accountGroupService.getMembers(
        req.params.id,
        req.user!.userId
      )
      res.json(members)
    } catch (error) {
      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Get members error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループから退会
 */
router.post(
  '/:id/leave',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await accountGroupService.leaveAccountGroup(
        req.params.id,
        req.user!.userId
      )
      res.status(200).json({ message: 'Successfully left the account group' })
    } catch (error) {
      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Leave account group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アカウントグループメンバー削除
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await accountGroupService.removeMember(
        req.params.id,
        req.params.userId,
        req.user!.userId
      )
      res.status(204).send()
    } catch (error) {
      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Remove member error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * 招待送信
 */
router.post(
  '/:id/invitations',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = sendInvitationSchema.parse(req.body)
      const invitation = await accountGroupService.sendInvitation(
        req.params.id,
        validatedData,
        req.user!.userId
      )

      res.status(201).json(invitation)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof ServiceAccountGroupError) {
        if (error.code === 'ACCOUNT_GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'USER_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'ALREADY_MEMBER') {
          return res.status(400).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
        if (error.code === 'VALIDATION_ERROR') {
          return res.status(400).json({ message: error.message })
        }
      }

      console.error('Send invitation error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

export default router
