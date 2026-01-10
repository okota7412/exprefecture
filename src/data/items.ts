// アイテムの型定義

export type ItemStatus = 'not_visited' | 'visited' | 'want_to_visit_again'

export type ItemTag =
  | 'food'
  | 'cafe'
  | 'sightseeing'
  | 'experience'
  | 'accommodation'
  | 'other'

export type Item = {
  id: string
  title: string
  description?: string
  prefectureId?: number
  cityName?: string
  status: ItemStatus
  tags: ItemTag[]
  mediaUrl?: string
  groupIds?: string[]
  createdAt: string
  updatedAt: string
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
