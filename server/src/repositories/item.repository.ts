/**
 * アイテムリポジトリ（データアクセス層）
 */
import type { CreateItemDto } from '../dto/item.dto.js'
import prisma from '../utils/prisma.js'

export interface Item {
  id: string
  title: string
  description: string | null
  prefectureId: number | null
  cityName: string | null
  status: string
  tags: string // JSON文字列
  mediaUrl: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface IItemRepository {
  create(data: CreateItemDto & { userId: string }): Promise<Item>
  findByPrefectureId(prefectureId: number): Promise<Item[]>
  findByGroupId(groupId: string): Promise<Item[]>
  findById(id: string): Promise<Item | null>
  findByUserId(userId: string): Promise<Item[]>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<number>
  getGroupIdsByItemId(itemId: string): Promise<string[]>
}

export class ItemRepository implements IItemRepository {
  async create(data: CreateItemDto & { userId: string }): Promise<Item> {
    // グループ関連を含めて作成
    const item = await prisma.$transaction(async tx => {
      const createdItem = await tx.item.create({
        data: {
          title: data.title,
          description: data.description,
          prefectureId: data.prefectureId ?? null,
          cityName: data.cityName,
          status: data.status,
          tags: JSON.stringify(data.tags),
          mediaUrl: data.mediaUrl,
          userId: data.userId,
        },
      })

      // グループとの関連を作成（SQLiteではskipDuplicatesが使えないため、個別に作成）
      if (data.groupIds && data.groupIds.length > 0) {
        // 重複を避けるために、既存の関連をチェック
        const existingRelations = await tx.itemGroup.findMany({
          where: {
            itemId: createdItem.id,
            groupId: { in: data.groupIds },
          },
          select: { groupId: true },
        })

        const existingGroupIds = new Set(
          existingRelations.map(rel => rel.groupId)
        )

        // 既存でない関連のみを作成
        const newGroupIds = data.groupIds.filter(
          groupId => !existingGroupIds.has(groupId)
        )

        if (newGroupIds.length > 0) {
          await Promise.all(
            newGroupIds.map(groupId =>
              tx.itemGroup.create({
                data: {
                  itemId: createdItem.id,
                  groupId,
                },
              })
            )
          )
        }
      }

      return createdItem
    })

    return item
  }

  async findByPrefectureId(prefectureId: number): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: { prefectureId },
      orderBy: { createdAt: 'desc' },
    })

    return items
  }

  async findByGroupId(groupId: string): Promise<Item[]> {
    const itemGroups = await prisma.itemGroup.findMany({
      where: { groupId },
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // アイテムをソート
    return itemGroups
      .map(ig => ig.item)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async findById(id: string): Promise<Item | null> {
    const item = await prisma.item.findUnique({
      where: { id },
    })

    return item
  }

  async getGroupIdsByItemId(itemId: string): Promise<string[]> {
    const itemGroups = await prisma.itemGroup.findMany({
      where: { itemId },
      select: { groupId: true },
    })

    return itemGroups.map(ig => ig.groupId)
  }

  async findByUserId(userId: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return items
  }

  async delete(id: string): Promise<void> {
    await prisma.item.delete({
      where: { id },
    })
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.item.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    return result.count
  }
}

export const itemRepository = new ItemRepository()
