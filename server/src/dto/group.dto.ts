/**
 * グループ関連のDTOとバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * グループ作成リクエストDTO
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
})

export type CreateGroupDto = z.infer<typeof createGroupSchema>

/**
 * グループ更新リクエストDTO
 */
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name is too long')
    .optional(),
  description: z
    .string()
    .max(500, 'Description is too long')
    .optional()
    .nullable(),
})

export type UpdateGroupDto = z.infer<typeof updateGroupSchema>

/**
 * グループレスポンスDTO
 */
export interface GroupResponse {
  id: string
  name: string
  description?: string
  userId: string
  itemCount?: number
  createdAt: string
  updatedAt: string
}
