/**
 * アイテムサービス（ビジネスロジック層）
 */
import type { CreateItemDto, ItemResponse } from '../dto/item.dto.js'
import { itemRepository } from '../repositories/item.repository.js'

export class ItemError extends Error {
  constructor(
    message: string,
    public readonly code: 'ITEM_NOT_FOUND' | 'VALIDATION_ERROR'
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
