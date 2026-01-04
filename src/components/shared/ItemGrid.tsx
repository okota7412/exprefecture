import { Item } from '@/data/items'

import { ItemCard } from './ItemCard'

type ItemGridProps = {
  items: Item[]
  onItemClick: (itemId: number) => void
  searchQuery?: string
}

export const ItemGrid = ({
  items,
  onItemClick,
  searchQuery = '',
}: ItemGridProps) => {
  const filteredItems = searchQuery.trim()
    ? items.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.cityName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2 text-sm md:text-base">
          {searchQuery.trim()
            ? '検索結果が見つかりませんでした'
            : 'アイテムがありません'}
        </p>
        {searchQuery.trim() && (
          <p className="text-xs md:text-sm text-gray-500">
            別のキーワードで検索してください
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
      role="list"
      aria-label="アイテム一覧"
    >
      {filteredItems.map(item => (
        <div key={item.id} role="listitem" className="h-[240px] md:h-[280px]">
          <ItemCard item={item} onClick={onItemClick} />
        </div>
      ))}
    </div>
  )
}
