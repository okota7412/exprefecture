/**
 * グループリポジトリ（データアクセス層）
 */
import type { CreateGroupDto, UpdateGroupDto } from '../dto/group.dto.js'
import prisma from '../utils/prisma.js'

export interface Group {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface IGroupRepository {
  create(data: CreateGroupDto & { userId: string }): Promise<Group>
  findById(id: string): Promise<Group | null>
  findByUserId(userId: string): Promise<Group[]>
  update(id: string, data: UpdateGroupDto): Promise<Group>
  delete(id: string): Promise<void>
  countItemsByGroupId(groupId: string): Promise<number>
  findGroupsByItemId(itemId: string): Promise<Group[]>
  addItemToGroup(itemId: string, groupId: string): Promise<void>
  removeItemFromGroup(itemId: string, groupId: string): Promise<void>
  removeAllItemsFromGroup(groupId: string): Promise<void>
  setItemGroups(itemId: string, groupIds: string[]): Promise<void>
}

export class GroupRepository implements IGroupRepository {
  async create(data: CreateGroupDto & { userId: string }): Promise<Group> {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
      },
    })

    return group
  }

  async findById(id: string): Promise<Group | null> {
    const group = await prisma.group.findUnique({
      where: { id },
    })

    return group
  }

  async findByUserId(userId: string): Promise<Group[]> {
    const groups = await prisma.group.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return groups
  }

  async update(id: string, data: UpdateGroupDto): Promise<Group> {
    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
      },
    })

    return group
  }

  async delete(id: string): Promise<void> {
    await prisma.group.delete({
      where: { id },
    })
  }

  async countItemsByGroupId(groupId: string): Promise<number> {
    const count = await prisma.itemGroup.count({
      where: { groupId },
    })

    return count
  }

  async findGroupsByItemId(itemId: string): Promise<Group[]> {
    const itemGroups = await prisma.itemGroup.findMany({
      where: { itemId },
      include: { group: true },
    })

    return itemGroups.map(ig => ig.group)
  }

  async addItemToGroup(itemId: string, groupId: string): Promise<void> {
    await prisma.itemGroup.create({
      data: {
        itemId,
        groupId,
      },
    })
  }

  async removeItemFromGroup(itemId: string, groupId: string): Promise<void> {
    await prisma.itemGroup.deleteMany({
      where: {
        itemId,
        groupId,
      },
    })
  }

  async removeAllItemsFromGroup(groupId: string): Promise<void> {
    await prisma.itemGroup.deleteMany({
      where: { groupId },
    })
  }

  async setItemGroups(itemId: string, groupIds: string[]): Promise<void> {
    // トランザクション内で実行
    await prisma.$transaction(async tx => {
      // 既存の関連を削除
      await tx.itemGroup.deleteMany({
        where: { itemId },
      })

      // 新しい関連を作成（SQLiteではskipDuplicatesが使えないため、個別に作成）
      if (groupIds.length > 0) {
        await Promise.all(
          groupIds.map(groupId =>
            tx.itemGroup.create({
              data: {
                itemId,
                groupId,
              },
            })
          )
        )
      }
    })
  }
}

export const groupRepository = new GroupRepository()
