// 地方ごとのアイテム数を取得する関数
// 現在はモックデータ。後でAPIから取得するように変更可能

import { regions } from '@/data/regions'

// モックデータ: 地方ごとのアイテム数
const mockItemCounts: Record<string, number> = {
  hokkaido: 12,
  tohoku: 8,
  kanto: 45,
  chubu: 23,
  kinki: 31,
  chugoku: 15,
  shikoku: 9,
  kyushu: 18,
  okinawa: 5,
}

export const getItemCountByRegion = (regionId: string): number => {
  return mockItemCounts[regionId] || 0
}

export const getTotalItemCount = (): number => {
  return regions.reduce((total, region) => {
    return total + getItemCountByRegion(region.id)
  }, 0)
}
