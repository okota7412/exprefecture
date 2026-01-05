/**
 * アイテムリポジトリ（データアクセス層）
 */
import type { CreateItemDto } from '../dto/item.dto.js'
import prisma from '../utils/prisma.js'

export interface Item {
  id: string
  title: string
  description: string | null
  prefectureId: number
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
  findById(id: string): Promise<Item | null>
  findByUserId(userId: string): Promise<Item[]>
}

export class ItemRepository implements IItemRepository {
  async create(data: CreateItemDto & { userId: string }): Promise<Item> {
    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        prefectureId: data.prefectureId,
        cityName: data.cityName,
        status: data.status,
        tags: JSON.stringify(data.tags),
        mediaUrl: data.mediaUrl,
        userId: data.userId,
      },
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

  async findById(id: string): Promise<Item | null> {
    const item = await prisma.item.findUnique({
      where: { id },
    })

    return item
  }

  async findByUserId(userId: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return items
  }
}

export const itemRepository = new ItemRepository()
