import { useState, useEffect } from 'react'

import { Item } from '@/data/items'

import { ItemCard } from './ItemCard'

type ItemGridProps = {
  items: Item[]
  onItemClick: (itemId: string) => void
  searchQuery?: string
  isDeleteMode?: boolean
  onDelete?: (itemId: string) => void
  onBulkDelete?: (itemIds: string[]) => void
}

export const ItemGrid = ({
  isDeleteMode = false,
  items,
  onBulkDelete,
  onDelete,
  onItemClick,
  searchQuery = '',
}: ItemGridProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const filteredItems = searchQuery.trim()
    ? items.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.cityName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  const handleSelectChange = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      return newSet
    })
  }

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.size > 0) {
      onBulkDelete(Array.from(selectedItems))
      setSelectedItems(new Set())
    }
  }

  // 削除モードがOFFになったら選択をクリア
  useEffect(() => {
    if (!isDeleteMode) {
      setSelectedItems(new Set())
    }
  }, [isDeleteMode])

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
    <>
      {isDeleteMode && selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedItems.size}件のアイテムが選択されています
          </span>
          {onBulkDelete && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              選択したアイテムを削除
            </button>
          )}
        </div>
      )}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        role="list"
        aria-label="アイテム一覧"
      >
        {filteredItems.map(item => (
          <div key={item.id} role="listitem" className="h-[240px] md:h-[280px]">
            <ItemCard
              item={item}
              onClick={onItemClick}
              isDeleteMode={isDeleteMode}
              isSelected={selectedItems.has(item.id)}
              onSelectChange={handleSelectChange}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </>
  )
}
