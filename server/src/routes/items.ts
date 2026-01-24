/**
 * アイテムルーター（コントローラー層）
 */
import express, { type Request, type Response } from 'express'
import { z } from 'zod'

import { createItemSchema, deleteItemsSchema } from '../dto/item.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import {
  itemService,
  ItemError as ServiceItemError,
} from '../services/item.service.js'

const router = express.Router()

/**
 * アイテム作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = createItemSchema.parse(req.body)
      const accountGroupId =
        req.body.accountGroupId || (req.query.accountGroupId as string)

      if (!accountGroupId) {
        return res.status(400).json({
          message: 'accountGroupId is required',
        })
      }

      const item = await itemService.createItem(
        validatedData,
        req.user!.userId,
        accountGroupId
      )

      res.status(201).json(item)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      console.error('Create item error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アイテム一覧取得
 * クエリパラメータ:
 * - prefectureId: 都道府県ID（任意、後で絞り込み機能用）
 * - groupId: グループID（任意）
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const prefectureId = req.query.prefectureId
      ? parseInt(req.query.prefectureId as string, 10)
      : undefined
    const groupId = req.query.groupId as string | undefined
    const accountGroupId = req.query.accountGroupId as string | undefined

    // accountGroupIdが必須
    if (!accountGroupId) {
      return res.status(400).json({
        message: 'accountGroupId is required',
      })
    }

    // グループIDが指定されている場合はグループで取得
    if (groupId) {
      if (
        !groupId.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
      ) {
        return res.status(400).json({
          message: 'Invalid groupId format',
        })
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[Items Route] getItemsByGroupId: groupId=${groupId}, accountGroupId=${accountGroupId}, userId=${req.user!.userId}`
        )
      }
      const items = await itemService.getItemsByGroupId(
        groupId,
        req.user!.userId,
        accountGroupId
      )
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[Items Route] getItemsByGroupId result: ${items.length} items`
        )
      }
      return res.json(items)
    }

    // 都道府県IDが指定されている場合は都道府県で取得（後で絞り込み機能用）
    if (prefectureId && !isNaN(prefectureId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[Items Route] getItemsByPrefecture: prefectureId=${prefectureId}, accountGroupId=${accountGroupId}`
        )
      }
      const items = await itemService.getItemsByPrefecture(
        prefectureId,
        accountGroupId
      )
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[Items Route] getItemsByPrefecture result: ${items.length} items`
        )
      }
      return res.json(items)
    }

    // クエリパラメータがない場合はユーザーの全アイテムを取得
    const items = await itemService.getItemsByUserId(
      req.user!.userId,
      accountGroupId
    )
    res.json(items)
  } catch (error) {
    console.error('Get items error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * アイテム詳細取得
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const item = await itemService.getItemById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }

    res.json(item)
  } catch (error) {
    console.error('Get item error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 * アイテム一括削除（/:idより前に定義する必要がある）
 */
router.delete(
  '/',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const validatedData = deleteItemsSchema.parse(req.body)
      const deletedCount = await itemService.deleteItems(
        validatedData.ids,
        req.user!.userId
      )

      res.status(200).json({
        message: 'Items deleted successfully',
        deletedCount,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        })
      }

      if (error instanceof ServiceItemError) {
        if (error.code === 'ITEM_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
        if (error.code === 'VALIDATION_ERROR') {
          return res.status(400).json({ message: error.message })
        }
      }

      console.error('Delete items error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

/**
 * アイテム個別削除（/:idは最後に定義）
 */
router.delete(
  '/:id',
  authenticateToken,
  verifyCsrfToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await itemService.deleteItem(req.params.id, req.user!.userId)
      res.status(204).send()
    } catch (error) {
      if (error instanceof ServiceItemError) {
        if (error.code === 'ITEM_NOT_FOUND') {
          return res.status(404).json({ message: error.message })
        }
        if (error.code === 'FORBIDDEN') {
          return res.status(403).json({ message: error.message })
        }
      }

      console.error('Delete item error:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
)

export default router
