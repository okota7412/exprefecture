import { Trash2 } from 'lucide-react'

import type { Item } from '@/data/items'
import { getStatusLabel, getTagLabel } from '@/data/items'

type ItemCardProps = {
  item: Item
  onClick: (itemId: string) => void
  isDeleteMode?: boolean
  isSelected?: boolean
  onSelectChange?: (itemId: string, selected: boolean) => void
  onDelete?: (itemId: string) => void
}

const getStatusColor = (status: Item['status']) => {
  switch (status) {
    case 'not_visited':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
      }
    case 'visited':
      return {
        bg: 'bg-teal-100',
        text: 'text-teal-700',
        border: 'border-teal-300',
      }
    case 'want_to_visit_again':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
      }
  }
}

const getTagColor = (tag: Item['tags'][number]) => {
  switch (tag) {
    case 'food':
      return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'cafe':
      return 'bg-amber-100 text-amber-700 border-amber-300'
    case 'sightseeing':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'experience':
      return 'bg-indigo-100 text-indigo-700 border-indigo-300'
    case 'accommodation':
      return 'bg-pink-100 text-pink-700 border-pink-300'
    case 'other':
      return 'bg-gray-100 text-gray-700 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

export const ItemCard = ({
  isDeleteMode = false,
  isSelected = false,
  item,
  onClick,
  onDelete,
  onSelectChange,
}: ItemCardProps) => {
  const statusColor = getStatusColor(item.status)

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDeleteMode && onSelectChange) {
      e.stopPropagation()
      onSelectChange(item.id, !isSelected)
    } else {
      onClick(item.id)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(item.id)
    }
  }

  return (
    <div
      className={`group relative w-full h-full bg-white border rounded-xl p-4 md:p-5 text-left transition-all duration-200 ${
        isDeleteMode
          ? isSelected
            ? 'border-teal-500 bg-teal-50/50 shadow-md'
            : 'border-gray-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
          : 'border-gray-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:border-teal-200'
      }`}
    >
      {/* 削除モード時のチェックボックス */}
      {isDeleteMode && (
        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation()
              if (onSelectChange) {
                onSelectChange(item.id, e.target.checked)
              }
            }}
            className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 cursor-pointer"
            aria-label={`${item.title}を選択`}
          />
        </div>
      )}

      {/* 削除モード外の削除ボタン */}
      {!isDeleteMode && onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label={`${item.title}を削除`}
        >
          <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
        </button>
      )}

      <button
        type="button"
        onClick={handleCardClick}
        className="w-full h-full focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 active:scale-[0.98]"
        aria-label={
          isDeleteMode ? `${item.title}を選択` : `${item.title}を開く`
        }
      >
        <div className="flex flex-col h-full">
          {/* サムネイル画像エリア（将来の拡張用） */}
          {item.mediaUrl && (
            <div className="w-full h-32 md:h-40 mb-3 md:mb-4 rounded-lg bg-gray-100 overflow-hidden">
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* タイトルと市名 */}
          <div className="flex-1 mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-950 mb-1.5 md:mb-2 leading-tight line-clamp-2">
              {item.title}
            </h3>
            {item.cityName && (
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                {item.cityName}
              </p>
            )}
            {item.description && (
              <p className="text-xs md:text-sm text-gray-500 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* ステータスバッジ */}
          <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-medium border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
            >
              {getStatusLabel(item.status)}
            </span>
          </div>

          {/* タグバッジ */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getTagColor(tag)}`}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
