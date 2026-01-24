/**
 * アカウントグループサービス（ビジネスロジック層）
 */
import type {
  AccountGroupInvitationResponse,
  AccountGroupMemberResponse,
  AccountGroupResponse,
  CreateAccountGroupDto,
  RespondToInvitationDto,
  SendInvitationDto,
  UpdateAccountGroupDto,
} from '../dto/account-group.dto.js'
import { accountGroupRepository } from '../repositories/account-group.repository.js'
import { userRepository } from '../repositories/user.repository.js'

export class AccountGroupError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'ACCOUNT_GROUP_NOT_FOUND'
      | 'VALIDATION_ERROR'
      | 'FORBIDDEN'
      | 'USER_NOT_FOUND'
      | 'ALREADY_MEMBER'
      | 'INVITATION_NOT_FOUND'
      | 'INVITATION_EXPIRED'
      | 'INVALID_INVITATION_STATUS'
  ) {
    super(message)
    this.name = 'AccountGroupError'
  }
}

export interface IAccountGroupService {
  createAccountGroup(
    dto: CreateAccountGroupDto,
    userId: string
  ): Promise<AccountGroupResponse>
  getAccountGroupsByUserId(userId: string): Promise<AccountGroupResponse[]>
  getAccountGroupById(id: string, userId: string): Promise<AccountGroupResponse>
  updateAccountGroup(
    id: string,
    dto: UpdateAccountGroupDto,
    userId: string
  ): Promise<AccountGroupResponse>
  deleteAccountGroup(id: string, userId: string): Promise<void>
  getPersonalAccountGroup(userId: string): Promise<AccountGroupResponse>
  // メンバー関連
  getMembers(
    accountGroupId: string,
    userId: string
  ): Promise<AccountGroupMemberResponse[]>
  removeMember(
    accountGroupId: string,
    targetUserId: string,
    userId: string
  ): Promise<void>
  leaveAccountGroup(accountGroupId: string, userId: string): Promise<void>
  // 招待関連
  sendInvitation(
    accountGroupId: string,
    dto: SendInvitationDto,
    userId: string
  ): Promise<AccountGroupInvitationResponse>
  getInvitationsByInvitee(
    userId: string,
    status?: string
  ): Promise<AccountGroupInvitationResponse[]>
  respondToInvitation(
    dto: RespondToInvitationDto,
    userId: string
  ): Promise<void>
}

export class AccountGroupService implements IAccountGroupService {
  async createAccountGroup(
    dto: CreateAccountGroupDto,
    userId: string
  ): Promise<AccountGroupResponse> {
    const accountGroup = await accountGroupRepository.create({
      ...dto,
      createdBy: userId,
      type: 'shared',
    })

    // 作成者をメンバーとして追加（ownerロール）
    await accountGroupRepository.addMember(accountGroup.id, userId, 'owner')

    const memberCount = await accountGroupRepository.countMembers(
      accountGroup.id
    )

    return this.mapToResponse(accountGroup, memberCount)
  }

  async getAccountGroupsByUserId(
    userId: string
  ): Promise<AccountGroupResponse[]> {
    // 作成したグループとメンバーとして参加しているグループを取得
    const createdGroups = await accountGroupRepository.findByUserId(userId)
    const memberGroups = await accountGroupRepository.findByMemberId(userId)

    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AccountGroupService] User ${userId}:`)
      console.log(`  Created groups: ${createdGroups.length}`)
      console.log(`  Member groups: ${memberGroups.length}`)
    }

    // 重複を除去（Setを使用）
    const allGroups = new Map<string, AccountGroupResponse>()
    for (const group of createdGroups) {
      const memberCount = await accountGroupRepository.countMembers(group.id)
      allGroups.set(group.id, this.mapToResponse(group, memberCount))
    }
    for (const group of memberGroups) {
      if (!allGroups.has(group.id)) {
        const memberCount = await accountGroupRepository.countMembers(group.id)
        allGroups.set(group.id, this.mapToResponse(group, memberCount))
      }
    }

    return Array.from(allGroups.values())
  }

  async getAccountGroupById(
    id: string,
    userId: string
  ): Promise<AccountGroupResponse> {
    const accountGroup = await accountGroupRepository.findById(id)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // メンバーかどうかチェック
    const member = await accountGroupRepository.findMember(id, userId)
    if (!member && accountGroup.createdBy !== userId) {
      throw new AccountGroupError(
        'Forbidden: You are not a member of this account group',
        'FORBIDDEN'
      )
    }

    const memberCount = await accountGroupRepository.countMembers(id)
    return this.mapToResponse(accountGroup, memberCount)
  }

  async updateAccountGroup(
    id: string,
    dto: UpdateAccountGroupDto,
    userId: string
  ): Promise<AccountGroupResponse> {
    const accountGroup = await accountGroupRepository.findById(id)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // 作成者またはadmin/ownerのみ更新可能
    const member = await accountGroupRepository.findMember(id, userId)
    if (
      accountGroup.createdBy !== userId &&
      (!member || (member.role !== 'owner' && member.role !== 'admin'))
    ) {
      throw new AccountGroupError(
        'Forbidden: You do not have permission to update this account group',
        'FORBIDDEN'
      )
    }

    const updatedGroup = await accountGroupRepository.update(id, dto)
    const memberCount = await accountGroupRepository.countMembers(id)
    return this.mapToResponse(updatedGroup, memberCount)
  }

  async deleteAccountGroup(id: string, userId: string): Promise<void> {
    const accountGroup = await accountGroupRepository.findById(id)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // 作成者のみ削除可能
    if (accountGroup.createdBy !== userId) {
      throw new AccountGroupError(
        'Forbidden: Only the creator can delete this account group',
        'FORBIDDEN'
      )
    }

    // 個人用グループは削除不可
    if (accountGroup.type === 'personal') {
      throw new AccountGroupError(
        'Forbidden: Personal account groups cannot be deleted',
        'FORBIDDEN'
      )
    }

    await accountGroupRepository.delete(id)
  }

  async getPersonalAccountGroup(userId: string): Promise<AccountGroupResponse> {
    let accountGroup =
      await accountGroupRepository.findPersonalGroupByUserId(userId)

    // 個人用グループが存在しない場合は作成
    if (!accountGroup) {
      accountGroup = await accountGroupRepository.create({
        name: '自分のみ',
        description: '個人用のアカウントグループ',
        createdBy: userId,
        type: 'personal',
      })

      // 作成者をメンバーとして追加（ownerロール）
      await accountGroupRepository.addMember(accountGroup.id, userId, 'owner')
    }

    const memberCount = await accountGroupRepository.countMembers(
      accountGroup.id
    )

    return this.mapToResponse(accountGroup, memberCount)
  }

  // メンバー関連
  async getMembers(
    accountGroupId: string,
    userId: string
  ): Promise<AccountGroupMemberResponse[]> {
    // メンバーかどうかチェック
    const member = await accountGroupRepository.findMember(
      accountGroupId,
      userId
    )
    const accountGroup = await accountGroupRepository.findById(accountGroupId)
    if (!member && accountGroup?.createdBy !== userId) {
      throw new AccountGroupError(
        'Forbidden: You are not a member of this account group',
        'FORBIDDEN'
      )
    }

    const members =
      await accountGroupRepository.findMembersByAccountGroupId(accountGroupId)

    return members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      role: m.role as 'owner' | 'admin' | 'member',
      joinedAt: m.joinedAt.toISOString(),
    }))
  }

  async removeMember(
    accountGroupId: string,
    targetUserId: string,
    userId: string
  ): Promise<void> {
    const accountGroup = await accountGroupRepository.findById(accountGroupId)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // 作成者またはadmin/ownerのみ削除可能
    const member = await accountGroupRepository.findMember(
      accountGroupId,
      userId
    )
    if (
      accountGroup.createdBy !== userId &&
      (!member || (member.role !== 'owner' && member.role !== 'admin'))
    ) {
      throw new AccountGroupError(
        'Forbidden: You do not have permission to remove members',
        'FORBIDDEN'
      )
    }

    // 自分自身は削除できない（作成者は除く）
    if (targetUserId === userId && accountGroup.createdBy !== userId) {
      throw new AccountGroupError(
        'Forbidden: You cannot remove yourself',
        'FORBIDDEN'
      )
    }

    // 作成者は削除できない
    if (targetUserId === accountGroup.createdBy) {
      throw new AccountGroupError(
        'Forbidden: Cannot remove the creator',
        'FORBIDDEN'
      )
    }

    await accountGroupRepository.removeMember(accountGroupId, targetUserId)
  }

  /**
   * アカウントグループから退会（自分自身が退会する場合）
   */
  async leaveAccountGroup(
    accountGroupId: string,
    userId: string
  ): Promise<void> {
    const accountGroup = await accountGroupRepository.findById(accountGroupId)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // 個人用グループは退会不可
    if (accountGroup.type === 'personal') {
      throw new AccountGroupError(
        'Forbidden: Cannot leave personal account group',
        'FORBIDDEN'
      )
    }

    // 作成者は退会不可（削除する必要がある）
    if (accountGroup.createdBy === userId) {
      throw new AccountGroupError(
        'Forbidden: Creator cannot leave the account group. Please delete the group instead.',
        'FORBIDDEN'
      )
    }

    // メンバーかどうかチェック
    const member = await accountGroupRepository.findMember(
      accountGroupId,
      userId
    )
    if (!member) {
      throw new AccountGroupError(
        'Forbidden: You are not a member of this account group',
        'FORBIDDEN'
      )
    }

    await accountGroupRepository.removeMember(accountGroupId, userId)
  }

  // 招待関連
  async sendInvitation(
    accountGroupId: string,
    dto: SendInvitationDto,
    userId: string
  ): Promise<AccountGroupInvitationResponse> {
    const accountGroup = await accountGroupRepository.findById(accountGroupId)
    if (!accountGroup) {
      throw new AccountGroupError(
        'Account group not found',
        'ACCOUNT_GROUP_NOT_FOUND'
      )
    }

    // メンバーかどうかチェック
    const member = await accountGroupRepository.findMember(
      accountGroupId,
      userId
    )
    if (!member && accountGroup.createdBy !== userId) {
      throw new AccountGroupError(
        'Forbidden: You are not a member of this account group',
        'FORBIDDEN'
      )
    }

    // 招待先ユーザーを取得
    const invitee = await userRepository.findByEmail(dto.inviteeEmail)
    if (!invitee) {
      throw new AccountGroupError('User not found', 'USER_NOT_FOUND')
    }

    // 既にメンバーかどうかチェック
    const existingMember = await accountGroupRepository.findMember(
      accountGroupId,
      invitee.id
    )
    if (existingMember) {
      throw new AccountGroupError('User is already a member', 'ALREADY_MEMBER')
    }

    // 既存の保留中の招待があるかチェック
    const existingInvitations =
      await accountGroupRepository.findInvitationsByInviteeId(
        invitee.id,
        'pending'
      )
    const hasPendingInvitation = existingInvitations.some(
      inv => inv.accountGroupId === accountGroupId
    )
    if (hasPendingInvitation) {
      throw new AccountGroupError('Invitation already sent', 'VALIDATION_ERROR')
    }

    // 招待の有効期限を設定（7日後）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await accountGroupRepository.createInvitation(
      accountGroupId,
      userId,
      invitee.id,
      expiresAt
    )

    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AccountGroupService] Invitation created:`)
      console.log(`  AccountGroup: ${accountGroup.name} (${accountGroupId})`)
      console.log(`  Inviter: ${inviter?.email || userId}`)
      console.log(`  Invitee: ${dto.inviteeEmail} (${invitee.id})`)
      console.log(`  Invitation ID: ${invitation.id}`)
    }

    const inviter = await userRepository.findById(userId)
    return {
      id: invitation.id,
      accountGroupId: invitation.accountGroupId,
      accountGroupName: accountGroup.name,
      inviterId: invitation.inviterId,
      inviterEmail: inviter?.email || '',
      inviteeId: invitation.inviteeId,
      inviteeEmail: dto.inviteeEmail,
      status: invitation.status as
        | 'pending'
        | 'accepted'
        | 'rejected'
        | 'expired',
      expiresAt: invitation.expiresAt?.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    }
  }

  async getInvitationsByInvitee(
    userId: string,
    status?: string
  ): Promise<AccountGroupInvitationResponse[]> {
    const invitations = await accountGroupRepository.findInvitationsByInviteeId(
      userId,
      status
    )

    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[AccountGroupService] getInvitationsByInvitee for user ${userId}:`
      )
      console.log(`  Found ${invitations.length} invitations`)
      invitations.forEach(inv => {
        console.log(`    - ${inv.accountGroup.name} (status: ${inv.status})`)
      })
    }

    const inviterIds = new Set(invitations.map(inv => inv.inviterId))
    const inviters = await Promise.all(
      Array.from(inviterIds).map(async id => {
        const user = await userRepository.findById(id)
        return { id, email: user?.email || '' }
      })
    )
    const inviterMap = new Map(inviters.map(i => [i.id, i.email]))

    return invitations.map(inv => ({
      id: inv.id,
      accountGroupId: inv.accountGroupId,
      accountGroupName: inv.accountGroup.name,
      inviterId: inv.inviterId,
      inviterEmail: inviterMap.get(inv.inviterId) || '',
      inviteeId: inv.inviteeId,
      inviteeEmail: '', // 自分なので不要
      status: inv.status as 'pending' | 'accepted' | 'rejected' | 'expired',
      expiresAt: inv.expiresAt?.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }))
  }

  async respondToInvitation(
    dto: RespondToInvitationDto,
    userId: string
  ): Promise<void> {
    const invitation = await accountGroupRepository.findInvitationById(
      dto.invitationId
    )
    if (!invitation) {
      throw new AccountGroupError(
        'Invitation not found',
        'INVITATION_NOT_FOUND'
      )
    }

    // 招待されたユーザーかどうかチェック
    if (invitation.inviteeId !== userId) {
      throw new AccountGroupError(
        'Forbidden: This invitation is not for you',
        'FORBIDDEN'
      )
    }

    // 既に処理済みかどうかチェック
    if (invitation.status !== 'pending') {
      throw new AccountGroupError(
        'Invitation has already been processed',
        'INVALID_INVITATION_STATUS'
      )
    }

    // 有効期限チェック
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await accountGroupRepository.updateInvitationStatus(
        invitation.id,
        'expired'
      )
      throw new AccountGroupError(
        'Invitation has expired',
        'INVITATION_EXPIRED'
      )
    }

    if (dto.action === 'accept') {
      // メンバーとして追加
      await accountGroupRepository.addMember(
        invitation.accountGroupId,
        userId,
        'member'
      )

      // 招待ステータスを更新
      await accountGroupRepository.updateInvitationStatus(
        invitation.id,
        'accepted'
      )
    } else if (dto.action === 'reject') {
      // 招待ステータスを更新
      await accountGroupRepository.updateInvitationStatus(
        invitation.id,
        'rejected'
      )
    }
  }

  private mapToResponse(
    accountGroup: {
      id: string
      name: string
      description: string | null
      type: string
      createdBy: string
      createdAt: Date
      updatedAt: Date
    },
    memberCount?: number
  ): AccountGroupResponse {
    return {
      id: accountGroup.id,
      name: accountGroup.name,
      description: accountGroup.description ?? undefined,
      type: accountGroup.type as 'personal' | 'shared',
      createdBy: accountGroup.createdBy,
      memberCount,
      createdAt: accountGroup.createdAt.toISOString(),
      updatedAt: accountGroup.updatedAt.toISOString(),
    }
  }
}

export const accountGroupService = new AccountGroupService()
