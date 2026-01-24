/**
 * アイテムルーター（コントローラー層）
 */
import express, { type Response } from 'express'

import { createItemSchema, deleteItemsSchema } from '../dto/item.dto.js'
import { authenticateToken, type AuthRequest } from '../middleware/auth.js'
import { verifyCsrfToken } from '../middleware/csrf.js'
import { asyncHandler } from '../middleware/error-handler.js'
import { itemService } from '../services/item.service.js'
import { NotFoundError, ValidationError } from '../utils/error-handler.js'
import { debug } from '../utils/logger.js'
import { isValidUUID } from '../utils/validation.js'

const router = express.Router()

/**
 * アイテム作成
 */
router.post(
  '/',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const validatedData = createItemSchema.parse(req.body)
    const accountGroupId =
      req.body.accountGroupId || (req.query.accountGroupId as string)

    if (!accountGroupId) {
      throw new ValidationError('accountGroupId is required')
    }

    const item = await itemService.createItem(
      validatedData,
      req.user.userId,
      accountGroupId
    )

    res.status(201).json(item)
  })
)

/**
 * アイテム一覧取得
 * クエリパラメータ:
 * - prefectureId: 都道府県ID（任意、後で絞り込み機能用）
 * - groupId: グループID（任意）
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const prefectureId = req.query.prefectureId
      ? parseInt(req.query.prefectureId as string, 10)
      : undefined
    const groupId = req.query.groupId as string | undefined
    const accountGroupId = req.query.accountGroupId as string | undefined

    // accountGroupIdが必須
    if (!accountGroupId) {
      throw new ValidationError('accountGroupId is required')
    }

    // グループIDが指定されている場合はグループで取得
    if (groupId) {
      if (!isValidUUID(groupId)) {
        throw new ValidationError('Invalid groupId format')
      }
      debug(
        `getItemsByGroupId: groupId=${groupId}, accountGroupId=${accountGroupId}, userId=${req.user.userId}`,
        'Items Route'
      )
      const items = await itemService.getItemsByGroupId(
        groupId,
        req.user.userId,
        accountGroupId
      )
      debug(`getItemsByGroupId result: ${items.length} items`, 'Items Route')
      return res.json(items)
    }

    // 都道府県IDが指定されている場合は都道府県で取得（後で絞り込み機能用）
    if (prefectureId && !isNaN(prefectureId)) {
      debug(
        `getItemsByPrefecture: prefectureId=${prefectureId}, accountGroupId=${accountGroupId}`,
        'Items Route'
      )
      const items = await itemService.getItemsByPrefecture(
        prefectureId,
        accountGroupId
      )
      debug(`getItemsByPrefecture result: ${items.length} items`, 'Items Route')
      return res.json(items)
    }

    // クエリパラメータがない場合はユーザーの全アイテムを取得
    const items = await itemService.getItemsByUserId(
      req.user.userId,
      accountGroupId
    )
    res.json(items)
  })
)

/**
 * アイテム詳細取得
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    if (!isValidUUID(id)) {
      throw new ValidationError('Invalid item ID format')
    }

    const item = await itemService.getItemById(id)

    if (!item) {
      throw new NotFoundError('Item not found')
    }

    res.json(item)
  })
)

/**
 * アイテム一括削除（/:idより前に定義する必要がある）
 */
router.delete(
  '/',
  authenticateToken,
  verifyCsrfToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated')
    }

    const validatedData = deleteItemsSchema.parse(req.body)
    const deletedCount = await itemService.deleteItems(
      validatedData.ids,
      req.user.userId
    )

    res.status(200).json({
      message: 'Items deleted successfully',
      deletedCount,
    })
  })
)

/**
 * アイテム個別削除（/:idは最後に定義）
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
      throw new ValidationError('Invalid item ID format')
    }

    await itemService.deleteItem(id, req.user.userId)
    res.status(204).send()
  })
)

export default router
