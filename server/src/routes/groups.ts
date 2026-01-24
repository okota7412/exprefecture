/**
 * グループルーター（コントローラー層）
 */
import express, { type Response } from 'express'
import { z } from 'zod'

import { createGroupSchema, updateGroupSchema } from '../dto/group.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import {
  groupService,
  GroupError as ServiceGroupError,
} from '../services/group.service.js'

const router = express.Router()

/**
 * グループ一覧取得
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const accountGroupId = req.query.accountGroupId as string | undefined
    const groups = await groupService.getGroupsByUserId(
      req.user!.userId,
      accountGroupId
    )
    res.json(groups)
  } catch (error) {
    console.error('Get groups error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * グループ作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createGroupSchema.parse(req.body)
      const accountGroupId =
        req.body.accountGroupId || (req.query.accountGroupId as string)

      if (!accountGroupId) {
        return res.status(400).json({
          message: 'accountGroupId is required',
        })
      }

      const group = await groupService.createGroup(
        validatedData,
        req.user!.userId,
        accountGroupId
      )

      res.status(201).json(group)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      console.error('Create group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * グループ詳細取得
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const accountGroupId = req.query.accountGroupId as string | undefined
      const group = await groupService.getGroupById(
        req.params.id,
        req.user!.userId,
        accountGroupId
      )
      res.json(group)
    } catch (error) {
      if (error instanceof ServiceGroupError) {
        if (error.code === 'GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Get group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * グループ更新
 */
router.patch(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = updateGroupSchema.parse(req.body)
      const accountGroupId =
        req.body.accountGroupId ||
        (req.query.accountGroupId as string | undefined)
      const group = await groupService.updateGroup(
        req.params.id,
        validatedData,
        req.user!.userId,
        accountGroupId
      )

      res.json(group)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof ServiceGroupError) {
        if (error.code === 'GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Update group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * グループ削除
 */
router.delete(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const accountGroupId = req.query.accountGroupId as string | undefined
      await groupService.deleteGroup(
        req.params.id,
        req.user!.userId,
        accountGroupId
      )
      res.status(204).send()
    } catch (error) {
      if (error instanceof ServiceGroupError) {
        if (error.code === 'GROUP_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Delete group error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

export default router
