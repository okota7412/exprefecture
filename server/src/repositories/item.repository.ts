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
  create(
    data: CreateItemDto & { userId: string; accountGroupId: string }
  ): Promise<Item>
  findByPrefectureId(
    prefectureId: number,
    accountGroupId?: string
  ): Promise<Item[]>
  findByGroupId(groupId: string, accountGroupId?: string): Promise<Item[]>
  findById(id: string): Promise<Item | null>
  findByUserId(userId: string, accountGroupId?: string): Promise<Item[]>
  delete(id: string): Promise<void>
  deleteMany(ids: string[]): Promise<number>
  getGroupIdsByItemId(itemId: string): Promise<string[]>
}

export class ItemRepository implements IItemRepository {
  async create(
    data: CreateItemDto & { userId: string; accountGroupId: string }
  ): Promise<Item> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] create: userId=${data.userId}, accountGroupId=${data.accountGroupId}, title=${data.title}`
      )
    }
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
          accountGroupId: data.accountGroupId,
        },
      })
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[ItemRepository] create result: itemId=${createdItem.id}, accountGroupId=${createdItem.accountGroupId}`
        )
      }

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

  async findByPrefectureId(
    prefectureId: number,
    accountGroupId?: string
  ): Promise<Item[]> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] findByPrefectureId: prefectureId=${prefectureId}, accountGroupId=${accountGroupId}`
      )
    }
    const items = await prisma.item.findMany({
      where: {
        prefectureId,
        ...(accountGroupId && { accountGroupId }),
      },
      orderBy: { createdAt: 'desc' },
    })
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] findByPrefectureId: found ${items.length} items`
      )
    }

    return items
  }

  async findByGroupId(
    groupId: string,
    accountGroupId?: string
  ): Promise<Item[]> {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] findByGroupId: groupId=${groupId}, accountGroupId=${accountGroupId}`
      )
    }
    const itemGroups = await prisma.itemGroup.findMany({
      where: { groupId },
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] findByGroupId: found ${itemGroups.length} itemGroups`
      )
    }

    // アイテムをフィルタリング（nullを除外、accountGroupIdでフィルタリング）
    let items = itemGroups
      .map(ig => ig.item)
      .filter((item): item is NonNullable<typeof item> => item !== null)
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[ItemRepository] findByGroupId: after null filter: ${items.length} items`
      )
    }

    // accountGroupIdでフィルタリング
    if (accountGroupId) {
      const beforeFilterCount = items.length
      items = items.filter(item => item.accountGroupId === accountGroupId)
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[ItemRepository] findByGroupId: after accountGroupId filter: ${items.length} items (was ${beforeFilterCount})`
        )
        items.forEach(item => {
          console.log(
            `  - Item: ${item.id}, accountGroupId: ${item.accountGroupId}, matches: ${item.accountGroupId === accountGroupId}`
          )
        })
      }
    }

    // ソート
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
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

  async findByUserId(userId: string, accountGroupId?: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        userId,
        ...(accountGroupId && { accountGroupId }),
      },
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
