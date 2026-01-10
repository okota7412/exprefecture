/**
 * グループサービス（ビジネスロジック層）
 */
import type {
  CreateGroupDto,
  GroupResponse,
  UpdateGroupDto,
} from '../dto/group.dto.js'
import { groupRepository } from '../repositories/group.repository.js'

export class GroupError extends Error {
  constructor(
    message: string,
    public readonly code: 'GROUP_NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN'
  ) {
    super(message)
    this.name = 'GroupError'
  }
}

export interface IGroupService {
  createGroup(dto: CreateGroupDto, userId: string): Promise<GroupResponse>
  getGroupsByUserId(userId: string): Promise<GroupResponse[]>
  getGroupById(id: string, userId: string): Promise<GroupResponse>
  updateGroup(
    id: string,
    dto: UpdateGroupDto,
    userId: string
  ): Promise<GroupResponse>
  deleteGroup(id: string, userId: string): Promise<void>
  getGroupsByItemId(itemId: string, userId: string): Promise<GroupResponse[]>
}

export class GroupService implements IGroupService {
  async createGroup(
    dto: CreateGroupDto,
    userId: string
  ): Promise<GroupResponse> {
    const group = await groupRepository.create({
      ...dto,
      userId,
    })

    return this.mapToResponse(group)
  }

  async getGroupsByUserId(userId: string): Promise<GroupResponse[]> {
    const groups = await groupRepository.findByUserId(userId)

    // 各グループのアイテム数を取得
    const groupsWithCount = await Promise.all(
      groups.map(async group => {
        const itemCount = await groupRepository.countItemsByGroupId(group.id)
        return { ...group, itemCount }
      })
    )

    return groupsWithCount.map(group =>
      this.mapToResponse(group, group.itemCount)
    )
  }

  async getGroupById(id: string, userId: string): Promise<GroupResponse> {
    const group = await groupRepository.findById(id)
    if (!group) {
      throw new GroupError('Group not found', 'GROUP_NOT_FOUND')
    }

    if (group.userId !== userId) {
      throw new GroupError(
        'Forbidden: You can only access your own groups',
        'FORBIDDEN'
      )
    }

    const itemCount = await groupRepository.countItemsByGroupId(group.id)
    return this.mapToResponse(group, itemCount)
  }

  async updateGroup(
    id: string,
    dto: UpdateGroupDto,
    userId: string
  ): Promise<GroupResponse> {
    const group = await groupRepository.findById(id)
    if (!group) {
      throw new GroupError('Group not found', 'GROUP_NOT_FOUND')
    }

    if (group.userId !== userId) {
      throw new GroupError(
        'Forbidden: You can only update your own groups',
        'FORBIDDEN'
      )
    }

    const updatedGroup = await groupRepository.update(id, dto)
    const itemCount = await groupRepository.countItemsByGroupId(updatedGroup.id)
    return this.mapToResponse(updatedGroup, itemCount)
  }

  async deleteGroup(id: string, userId: string): Promise<void> {
    const group = await groupRepository.findById(id)
    if (!group) {
      throw new GroupError('Group not found', 'GROUP_NOT_FOUND')
    }

    if (group.userId !== userId) {
      throw new GroupError(
        'Forbidden: You can only delete your own groups',
        'FORBIDDEN'
      )
    }

    await groupRepository.delete(id)
  }

  async getGroupsByItemId(
    itemId: string,
    userId: string
  ): Promise<GroupResponse[]> {
    // アイテムがユーザーのものかチェック（簡易的な実装）
    // 実際にはアイテムリポジトリでチェックする必要があるかもしれません
    const groups = await groupRepository.findGroupsByItemId(itemId)

    // ユーザーが所有するグループのみを返す
    const userGroups = groups.filter(group => group.userId === userId)

    return userGroups.map(group => this.mapToResponse(group))
  }

  private mapToResponse(
    group: {
      id: string
      name: string
      description: string | null
      userId: string
      createdAt: Date
      updatedAt: Date
    },
    itemCount?: number
  ): GroupResponse {
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? undefined,
      userId: group.userId,
      itemCount,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    }
  }
}

export const groupService = new GroupService()
