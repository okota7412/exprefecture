/**
 * アカウントグループ関連のDTOとバリデーションスキーマ
 */
import { z } from 'zod'

/**
 * アカウントグループ作成リクエストDTO
 */
export const createAccountGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Account group name is required')
    .max(100, 'Account group name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
})

export type CreateAccountGroupDto = z.infer<typeof createAccountGroupSchema>

/**
 * アカウントグループ更新リクエストDTO
 */
export const updateAccountGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Account group name is required')
    .max(100, 'Account group name is too long')
    .optional(),
  description: z
    .string()
    .max(500, 'Description is too long')
    .optional()
    .nullable(),
})

export type UpdateAccountGroupDto = z.infer<typeof updateAccountGroupSchema>

/**
 * 招待送信リクエストDTO
 */
export const sendInvitationSchema = z.object({
  inviteeEmail: z.string().email('Invalid email address'),
})

export type SendInvitationDto = z.infer<typeof sendInvitationSchema>

/**
 * 招待応答リクエストDTO
 */
export const respondToInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
  action: z.enum(['accept', 'reject']),
})

export type RespondToInvitationDto = z.infer<typeof respondToInvitationSchema>

/**
 * アカウントグループレスポンスDTO
 */
export interface AccountGroupResponse {
  id: string
  name: string
  description?: string
  type: 'personal' | 'shared'
  createdBy: string
  memberCount?: number
  createdAt: string
  updatedAt: string
}

/**
 * アカウントグループメンバーレスポンスDTO
 */
export interface AccountGroupMemberResponse {
  id: string
  userId: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

/**
 * アカウントグループ招待レスポンスDTO
 */
export interface AccountGroupInvitationResponse {
  id: string
  accountGroupId: string
  accountGroupName: string
  inviterId: string
  inviterEmail: string
  inviteeId: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  expiresAt?: string
  createdAt: string
  updatedAt: string
}
