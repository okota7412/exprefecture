import * as Dialog from '@radix-ui/react-dialog'
import { MapPin, X } from 'lucide-react'

import type { Item } from '@/data/items'
import { getStatusLabel, getTagLabel } from '@/data/items'
import { prefectures } from '@/data/prefectures'

type ItemDetailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
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

const getStatusColor = (status: Item['status']) => {
  switch (status) {
    case 'not_visited':
      return 'bg-gray-100 text-gray-700 border-gray-300'
    case 'visited':
      return 'bg-teal-100 text-teal-700 border-teal-300'
    case 'want_to_visit_again':
      return 'bg-emerald-100 text-emerald-700 border-emerald-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

export const ItemDetailModal = ({
  item,
  onOpenChange,
  open,
}: ItemDetailModalProps) => {
  if (!item) return null

  const prefecture = item.prefectureId
    ? prefectures.find(p => p.id === item.prefectureId)
    : null
  const locationText = [prefecture?.name, item.cityName]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="sr-only">{item.title}の詳細</Dialog.Title>

          <div className="space-y-6">
            {/* 画像 */}
            {item.mediaUrl && (
              <div className="w-full h-48 md:h-56 rounded-xl bg-gray-100 overflow-hidden">
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* タイトル */}
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {item.title}
            </h2>

            {/* 場所 */}
            {locationText && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 shrink-0 text-teal-600" />
                <span>{locationText}</span>
              </div>
            )}

            {/* 説明 */}
            {item.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  説明
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {/* ステータス・タグ */}
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}
              >
                {getStatusLabel(item.status)}
              </span>
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${getTagColor(tag)}`}
                >
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>

            {/* 日付 */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              <p>
                作成日:{' '}
                {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              {item.updatedAt !== item.createdAt && (
                <p className="mt-1">
                  更新日:{' '}
                  {new Date(item.updatedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
