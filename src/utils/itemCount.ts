// 地方・都道府県ごとのアイテム数を取得する関数
// 現在はモックデータ。後でAPIから取得するように変更可能

import { regions } from '@/data/regions'

// モックデータ: 地方ごとのアイテム数
const mockRegionItemCounts: Record<string, number> = {
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

// モックデータ: 都道府県ごとのアイテム数
const mockPrefectureItemCounts: Record<number, number> = {
  1: 12, // 北海道
  2: 2,
  3: 1,
  4: 3,
  5: 1,
  6: 1,
  7: 0, // 東北
  8: 5,
  9: 3,
  10: 2,
  11: 4,
  12: 6,
  13: 15,
  14: 10, // 関東
  15: 3,
  16: 2,
  17: 4,
  18: 1,
  19: 2,
  20: 5,
  21: 2,
  22: 3,
  23: 1, // 中部
  24: 2,
  25: 1,
  26: 8,
  27: 12,
  28: 4,
  29: 2,
  30: 2, // 近畿
  31: 1,
  32: 2,
  33: 4,
  34: 5,
  35: 3, // 中国
  36: 2,
  37: 3,
  38: 2,
  39: 2, // 四国
  40: 5,
  41: 2,
  42: 3,
  43: 3,
  44: 2,
  45: 2,
  46: 1, // 九州
  47: 5, // 沖縄
}

export const getItemCountByRegion = (regionId: string): number => {
  return mockRegionItemCounts[regionId] || 0
}

export const getItemCountByPrefecture = (prefectureId: number): number => {
  return mockPrefectureItemCounts[prefectureId] || 0
}

export const getTotalItemCount = (): number => {
  return regions.reduce((total, region) => {
    return total + getItemCountByRegion(region.id)
  }, 0)
}
