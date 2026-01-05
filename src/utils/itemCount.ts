// 地方・都道府県ごとのアイテム数を取得する関数
// APIから取得

import { customInstance } from '@/api/client'
import type { Item } from '@/data/items'
import { regions } from '@/data/regions'

/**
 * 都道府県ごとのアイテム数を取得（APIから）
 */
export const getItemCountByPrefecture = async (
  prefectureId: number
): Promise<number> => {
  try {
    const response = await customInstance.get<Item[]>('/api/items', {
      params: { prefectureId },
    })
    return response.data.length
  } catch (error) {
    console.error('Failed to fetch item count:', error)
    return 0
  }
}

/**
 * 地方ごとのアイテム数を取得（APIから）
 */
export const getItemCountByRegion = async (
  regionId: string
): Promise<number> => {
  try {
    const region = regions.find(r => r.id === regionId)
    if (!region) {
      return 0
    }

    // 地方に属する都道府県のアイテム数を合計
    const counts = await Promise.all(
      region.prefectureIds.map(prefectureId =>
        getItemCountByPrefecture(prefectureId)
      )
    )
    return counts.reduce((total, count) => total + count, 0)
  } catch (error) {
    console.error('Failed to fetch region item count:', error)
    return 0
  }
}

/**
 * 全アイテム数を取得（APIから）
 */
export const getTotalItemCount = async (): Promise<number> => {
  try {
    const counts = await Promise.all(
      regions.map(region => getItemCountByRegion(region.id))
    )
    return counts.reduce((total, count) => total + count, 0)
  } catch (error) {
    console.error('Failed to fetch total item count:', error)
    return 0
  }
}
