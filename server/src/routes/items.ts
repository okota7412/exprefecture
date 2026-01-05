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
      const item = await itemService.createItem(validatedData, req.user!.userId)

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
 * 都道府県別アイテム一覧取得
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const prefectureId = req.query.prefectureId
      ? parseInt(req.query.prefectureId as string, 10)
      : undefined

    if (!prefectureId || isNaN(prefectureId)) {
      return res.status(400).json({
        message: 'prefectureId query parameter is required',
      })
    }

    const items = await itemService.getItemsByPrefecture(prefectureId)
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
