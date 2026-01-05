/**
 * アイテム関連のDTOとバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * アイテムステータス
 */
export const itemStatusSchema = z.enum([
  'not_visited',
  'visited',
  'want_to_visit_again',
])

/**
 * アイテムタグ
 */
export const itemTagSchema = z.enum([
  'food',
  'cafe',
  'sightseeing',
  'experience',
  'accommodation',
  'other',
])

/**
 * アイテム作成リクエストDTO
 */
export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  prefectureId: z.number().int().positive('Prefecture ID must be positive'),
  cityName: z.string().max(100, 'City name is too long').optional(),
  status: itemStatusSchema.default('not_visited'),
  tags: z.array(itemTagSchema).min(1, 'At least one tag is required'),
  mediaUrl: z.string().url('Invalid URL format').optional(),
})

export type CreateItemDto = z.infer<typeof createItemSchema>

/**
 * 一括削除リクエストDTO
 */
export const deleteItemsSchema = z.object({
  ids: z
    .array(z.string().uuid('Invalid UUID format'))
    .min(1, 'At least one item ID is required')
    .max(50, 'Cannot delete more than 50 items at once'),
})

export type DeleteItemsDto = z.infer<typeof deleteItemsSchema>

/**
 * アイテムレスポンスDTO
 */
export interface ItemResponse {
  id: string
  title: string
  description?: string
  prefectureId: number
  cityName?: string
  status: string
  tags: string[]
  mediaUrl?: string
  userId: string
  createdAt: string
  updatedAt: string
}
