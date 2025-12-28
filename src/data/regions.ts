import { prefectures } from './prefectures'

export type Region = {
  id: string
  name: string
  prefectureIds: number[]
}

export const regions: Region[] = [
  {
    id: 'hokkaido',
    name: '北海道',
    prefectureIds: [1],
  },
  {
    id: 'tohoku',
    name: '東北',
    prefectureIds: [2, 3, 4, 5, 6, 7],
  },
  {
    id: 'kanto',
    name: '関東',
    prefectureIds: [8, 9, 10, 11, 12, 13, 14],
  },
  {
    id: 'chubu',
    name: '中部',
    prefectureIds: [15, 16, 17, 18, 19, 20, 21, 22, 23],
  },
  {
    id: 'kinki',
    name: '近畿',
    prefectureIds: [24, 25, 26, 27, 28, 29, 30],
  },
  {
    id: 'chugoku',
    name: '中国',
    prefectureIds: [31, 32, 33, 34, 35],
  },
  {
    id: 'shikoku',
    name: '四国',
    prefectureIds: [36, 37, 38, 39],
  },
  {
    id: 'kyushu',
    name: '九州',
    prefectureIds: [40, 41, 42, 43, 44, 45, 46],
  },
  {
    id: 'okinawa',
    name: '沖縄',
    prefectureIds: [47],
  },
]

// 地方IDから地方情報を取得
export const getRegionById = (regionId: string): Region | undefined => {
  return regions.find(r => r.id === regionId)
}

// 地方に含まれる都道府県を取得
export const getPrefecturesByRegion = (regionId: string) => {
  const region = getRegionById(regionId)
  if (!region) return []
  return prefectures.filter(p => region.prefectureIds.includes(p.id))
}
