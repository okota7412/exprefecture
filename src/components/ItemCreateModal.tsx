import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import type { Group } from '@/data/groups'
import type { ItemStatus, ItemTag } from '@/data/items'
import { getStatusLabel, getTagLabel } from '@/data/items'
import { cn } from '@/lib/utils'

type ItemCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultGroupIds?: string[]
  prefectureId?: number
  onSuccess: () => void
}

const ITEM_STATUSES: ItemStatus[] = [
  'not_visited',
  'visited',
  'want_to_visit_again',
]

const ITEM_TAGS: ItemTag[] = [
  'food',
  'cafe',
  'sightseeing',
  'experience',
  'accommodation',
  'other',
]

export const ItemCreateModal = ({
  defaultGroupIds = [],
  onOpenChange,
  onSuccess,
  open,
}: ItemCreateModalProps) => {
  const { currentAccountGroupId } = useAccountGroup()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cityName, setCityName] = useState('')
  const [status, setStatus] = useState<ItemStatus>('not_visited')
  const [tags, setTags] = useState<ItemTag[]>([])
  const [mediaUrl, setMediaUrl] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] =
    useState<string[]>(defaultGroupIds)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // グループ一覧を取得
  useEffect(() => {
    if (!currentAccountGroupId) {
      return
    }

    const fetchGroups = async () => {
      setIsLoadingGroups(true)
      try {
        const response = await customInstance.get<Group[]>('/api/groups', {
          params: { accountGroupId: currentAccountGroupId },
        })
        setGroups(response.data)
        // デフォルトグループIDが指定されている場合は選択状態にする
        if (defaultGroupIds.length > 0) {
          setSelectedGroupIds(defaultGroupIds)
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
      } finally {
        setIsLoadingGroups(false)
      }
    }

    if (open && currentAccountGroupId) {
      fetchGroups()
    }
  }, [open, defaultGroupIds, currentAccountGroupId])

  // モーダルが開かれた時にデフォルトグループIDを設定
  useEffect(() => {
    if (open && defaultGroupIds.length > 0) {
      setSelectedGroupIds(defaultGroupIds)
    }
  }, [open, defaultGroupIds])

  const handleTagToggle = (tag: ItemTag) => {
    setTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (tags.length === 0) {
      setError('少なくとも1つのタグを選択してください')
      return
    }

    setIsLoading(true)

    try {
      if (!currentAccountGroupId) {
        setError('アカウントグループが選択されていません')
        setIsLoading(false)
        return
      }

      // アイテムを作成（CSRFトークンはインターセプターで自動設定される）
      await customInstance.post('/api/items', {
        title,
        description: description || undefined,
        cityName: cityName || undefined,
        status,
        tags,
        mediaUrl: mediaUrl || undefined,
        groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
        accountGroupId: currentAccountGroupId,
      })

      // 成功時はフォームをリセットしてモーダルを閉じる
      setTitle('')
      setDescription('')
      setCityName('')
      setStatus('not_visited')
      setTags([])
      setMediaUrl('')
      setSelectedGroupIds(defaultGroupIds)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'アイテムの作成に失敗しました。もう一度お試しください。'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // モーダルを閉じる際にフォームをリセット
      setTitle('')
      setDescription('')
      setCityName('')
      setStatus('not_visited')
      setTags([])
      setMediaUrl('')
      setSelectedGroupIds(defaultGroupIds)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
            新しいアイテムを作成
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="item-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                id="item-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="例: 東京タワー"
              />
            </div>

            <div>
              <label
                htmlFor="item-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                説明
              </label>
              <textarea
                id="item-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="アイテムの説明を入力してください"
              />
            </div>

            <div>
              <label
                htmlFor="item-city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                市区町村
              </label>
              <input
                id="item-city"
                type="text"
                value={cityName}
                onChange={e => setCityName(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="例: 港区"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                グループ
              </label>
              {isLoadingGroups ? (
                <div className="text-sm text-gray-500 py-2">読み込み中...</div>
              ) : groups.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                  グループがありません。まずグループを作成してください。
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-md">
                  {groups.map(group => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">
                        {group.name}
                      </span>
                      {group.description && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {group.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <div className="flex gap-2 flex-wrap">
                {ITEM_STATUSES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      status === s
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タグ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {ITEM_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                      tags.includes(tag)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {getTagLabel(tag)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="item-media-url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                メディアURL
              </label>
              <input
                id="item-media-url"
                type="url"
                value={mediaUrl}
                onChange={e => setMediaUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
          {selectedGroupIds.length === 0 && (
            <div className="mt-2 text-xs text-amber-600">
              注意:
              グループを選択しない場合、このアイテムはどのグループにも所属しません。
            </div>
          )}

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
