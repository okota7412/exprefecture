// アイテムの型定義とモックデータ
// 後でAPIから取得するように変更可能

export type ItemStatus = 'not_visited' | 'visited' | 'want_to_visit_again'

export type ItemTag =
  | 'food'
  | 'cafe'
  | 'sightseeing'
  | 'experience'
  | 'accommodation'
  | 'other'

export type Item = {
  id: number
  title: string
  description?: string
  prefectureId: number
  cityName?: string
  status: ItemStatus
  tags: ItemTag[]
  mediaUrl?: string
  createdAt: string
  updatedAt: string
}

// モックデータ: 都道府県ごとのアイテム
const mockItems: Item[] = [
  // 東京都のアイテム
  {
    id: 1,
    title: '東京タワー',
    description: '東京のシンボルタワー',
    prefectureId: 13,
    cityName: '港区',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: '浅草寺',
    description: '東京最古の寺院',
    prefectureId: 13,
    cityName: '台東区',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    title: '築地市場',
    description: '新鮮な魚介類が楽しめる',
    prefectureId: 13,
    cityName: '中央区',
    status: 'not_visited',
    tags: ['food'],
    mediaUrl: undefined,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    title: 'スターバックス リザーブ ロースタリー 東京',
    description: '世界最大級のスターバックス',
    prefectureId: 13,
    cityName: '目黒区',
    status: 'want_to_visit_again',
    tags: ['cafe'],
    mediaUrl: undefined,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 5,
    title: '東京スカイツリー',
    description: '世界一高いタワー',
    prefectureId: 13,
    cityName: '墨田区',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  // 神奈川県のアイテム
  {
    id: 6,
    title: '横浜中華街',
    description: '日本最大の中華街',
    prefectureId: 14,
    cityName: '横浜市',
    status: 'visited',
    tags: ['food', 'sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
  {
    id: 7,
    title: '江の島',
    description: '湘南の観光スポット',
    prefectureId: 14,
    cityName: '藤沢市',
    status: 'not_visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z',
  },
  {
    id: 8,
    title: '箱根温泉',
    description: '人気の温泉地',
    prefectureId: 14,
    cityName: '箱根町',
    status: 'want_to_visit_again',
    tags: ['accommodation', 'experience'],
    mediaUrl: undefined,
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 9,
    title: '鎌倉大仏',
    description: '高徳院の大仏様',
    prefectureId: 14,
    cityName: '鎌倉市',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-09T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
  },
  {
    id: 10,
    title: '横浜ランドマークタワー',
    description: '横浜のシンボル',
    prefectureId: 14,
    cityName: '横浜市',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  // 大阪府のアイテム
  {
    id: 11,
    title: '通天閣',
    description: '大阪のシンボルタワー',
    prefectureId: 27,
    cityName: '大阪市',
    status: 'visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
  },
  {
    id: 12,
    title: '道頓堀',
    description: '大阪の繁華街',
    prefectureId: 27,
    cityName: '大阪市',
    status: 'visited',
    tags: ['food', 'sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  // 北海道のアイテム
  {
    id: 13,
    title: '札幌時計台',
    description: '札幌のシンボル',
    prefectureId: 1,
    cityName: '札幌市',
    status: 'not_visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-13T00:00:00Z',
    updatedAt: '2024-01-13T00:00:00Z',
  },
  {
    id: 14,
    title: '函館山',
    description: '函館の夜景スポット',
    prefectureId: 1,
    cityName: '函館市',
    status: 'not_visited',
    tags: ['sightseeing'],
    mediaUrl: undefined,
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
  },
  {
    id: 15,
    title: '富良野ラベンダー畑',
    description: '夏の風物詩',
    prefectureId: 1,
    cityName: '富良野市',
    status: 'not_visited',
    tags: ['sightseeing', 'experience'],
    mediaUrl: undefined,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
]

// 都道府県IDからアイテム一覧を取得
export const getItemsByPrefecture = (prefectureId: number): Item[] => {
  return mockItems.filter(item => item.prefectureId === prefectureId)
}

// アイテムIDからアイテムを取得
export const getItemById = (itemId: number): Item | undefined => {
  return mockItems.find(item => item.id === itemId)
}

// ステータス名を日本語に変換
export const getStatusLabel = (status: ItemStatus): string => {
  switch (status) {
    case 'not_visited':
      return '行ってない'
    case 'visited':
      return '行った'
    case 'want_to_visit_again':
      return 'また行きたい'
    default:
      return status
  }
}

// タグ名を日本語に変換
export const getTagLabel = (tag: ItemTag): string => {
  switch (tag) {
    case 'food':
      return '飯'
    case 'cafe':
      return 'カフェ'
    case 'sightseeing':
      return '観光'
    case 'experience':
      return '体験'
    case 'accommodation':
      return '宿'
    case 'other':
      return 'その他'
    default:
      return tag
  }
}
