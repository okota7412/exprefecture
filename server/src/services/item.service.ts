/**
 * アイテムサービス（ビジネスロジック層）
 */
import type { CreateItemDto, ItemResponse } from '../dto/item.dto.js'
import { itemRepository } from '../repositories/item.repository.js'

export class ItemError extends Error {
  constructor(
    message: string,
    public readonly code: 'ITEM_NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN'
  ) {
    super(message)
    this.name = 'ItemError'
  }
}

export interface IItemService {
  createItem(dto: CreateItemDto, userId: string): Promise<ItemResponse>
  getItemsByPrefecture(prefectureId: number): Promise<ItemResponse[]>
  getItemById(id: string): Promise<ItemResponse | null>
  getItemsByUserId(userId: string): Promise<ItemResponse[]>
  deleteItem(id: string, userId: string): Promise<void>
  deleteItems(ids: string[], userId: string): Promise<number>
}

export class ItemService implements IItemService {
  async createItem(dto: CreateItemDto, userId: string): Promise<ItemResponse> {
    const item = await itemRepository.create({
      ...dto,
      userId,
    })

    return this.mapToResponse(item)
  }

  async getItemsByPrefecture(prefectureId: number): Promise<ItemResponse[]> {
    const items = await itemRepository.findByPrefectureId(prefectureId)
    return items.map(item => this.mapToResponse(item))
  }

  async getItemById(id: string): Promise<ItemResponse | null> {
    const item = await itemRepository.findById(id)
    if (!item) {
      return null
    }
    return this.mapToResponse(item)
  }

  async getItemsByUserId(userId: string): Promise<ItemResponse[]> {
    const items = await itemRepository.findByUserId(userId)
    return items.map(item => this.mapToResponse(item))
  }

  async deleteItem(id: string, userId: string): Promise<void> {
    const item = await itemRepository.findById(id)
    if (!item) {
      throw new ItemError('Item not found', 'ITEM_NOT_FOUND')
    }

    if (item.userId !== userId) {
      throw new ItemError(
        'Forbidden: You can only delete your own items',
        'FORBIDDEN'
      )
    }

    await itemRepository.delete(id)
  }

  async deleteItems(ids: string[], userId: string): Promise<number> {
    // 重複を除去
    const uniqueIds = [...new Set(ids)]

    // ID配列のサイズ制限（最大50件）
    if (uniqueIds.length > 50) {
      throw new ItemError(
        'Too many items to delete (max 50)',
        'VALIDATION_ERROR'
      )
    }

    // 各アイテムの所有権をチェック
    const items = await Promise.all(
      uniqueIds.map(id => itemRepository.findById(id))
    )

    // 存在しないアイテムをチェック
    const notFoundIds = items
      .map((item, index) => (!item ? uniqueIds[index] : null))
      .filter((id): id is string => id !== null)

    if (notFoundIds.length > 0) {
      throw new ItemError(
        `Items not found: ${notFoundIds.join(', ')}`,
        'ITEM_NOT_FOUND'
      )
    }

    // 所有権をチェック
    const forbiddenItems = items
      .map((item, index) =>
        item && item.userId !== userId ? uniqueIds[index] : null
      )
      .filter((id): id is string => id !== null)

    if (forbiddenItems.length > 0) {
      throw new ItemError(
        'Forbidden: You can only delete your own items',
        'FORBIDDEN'
      )
    }

    // 一括削除を実行
    const deletedCount = await itemRepository.deleteMany(uniqueIds)
    return deletedCount
  }

  private mapToResponse(item: {
    id: string
    title: string
    description: string | null
    prefectureId: number
    cityName: string | null
    status: string
    tags: string
    mediaUrl: string | null
    userId: string
    createdAt: Date
    updatedAt: Date
  }): ItemResponse {
    return {
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      prefectureId: item.prefectureId,
      cityName: item.cityName ?? undefined,
      status: item.status,
      tags: JSON.parse(item.tags) as string[],
      mediaUrl: item.mediaUrl ?? undefined,
      userId: item.userId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }
  }
}

export const itemService = new ItemService()
