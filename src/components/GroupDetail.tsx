import { Plus, Trash2, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import type { Group } from '@/data/groups'
import type { Item, ItemStatus, ItemTag } from '@/data/items'

import { ItemCreateModal } from './ItemCreateModal'
import { BackButton } from './shared/BackButton'
import { DeleteConfirmDialog } from './shared/DeleteConfirmDialog'
import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { ItemGrid } from './shared/ItemGrid'
import { SearchBar } from './shared/SearchBar'

export const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { currentAccountGroupId } = useAccountGroup()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchGroup = useCallback(async () => {
    if (!groupId || !currentAccountGroupId) return

    try {
      const response = await customInstance.get<Group>(
        `/api/groups/${groupId}`,
        {
          params: { accountGroupId: currentAccountGroupId },
        }
      )
      setGroup(response.data)
    } catch (err) {
      console.error('Failed to fetch group:', err)
      setError('グループの取得に失敗しました')
      setGroup(null)
    }
  }, [groupId, currentAccountGroupId])

  const fetchItems = useCallback(async () => {
    if (!groupId || !currentAccountGroupId) {
      console.log('[GroupDetail] fetchItems skipped:', {
        groupId,
        currentAccountGroupId,
      })
      return
    }

    console.log('[GroupDetail] fetchItems:', { groupId, currentAccountGroupId })
    setIsLoading(true)
    setError(null)
    try {
      const response = await customInstance.get<Item[]>('/api/items', {
        params: { groupId, accountGroupId: currentAccountGroupId },
      })
      console.log(
        '[GroupDetail] fetchItems result:',
        response.data.length,
        'items'
      )

      if (response.data.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(
          '[GroupDetail] fetchItems items:',
          response.data.map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title,
            accountGroupId: item.accountGroupId,
            userId: item.userId,
          }))
        )
      }
      const itemsData: Item[] = response.data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        prefectureId: item.prefectureId,
        cityName: item.cityName,
        status: item.status as ItemStatus,
        tags: item.tags as ItemTag[],
        mediaUrl: item.mediaUrl,
        groupIds: item.groupIds,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      setItems(itemsData)
    } catch (err) {
      console.error('Failed to fetch items:', err)
      setError('アイテムの取得に失敗しました')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [groupId, currentAccountGroupId])

  // APIからグループとアイテムを取得
  useEffect(() => {
    console.log('[GroupDetail] useEffect:', { groupId, currentAccountGroupId })
    if (!groupId) {
      console.log('[GroupDetail] useEffect: Skipping (no groupId)')
      setIsLoading(false)
      setItems([])
      setGroup(null)
      return
    }

    if (!currentAccountGroupId) {
      console.log(
        '[GroupDetail] useEffect: Skipping fetchItems (no currentAccountGroupId)'
      )
    }

    fetchGroup()
    fetchItems()
  }, [groupId, currentAccountGroupId, fetchGroup, fetchItems])

  if (!groupId) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              グループが見つかりません
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!group && !isLoading) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              グループが見つかりません
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const itemCount = items.length

  const handleItemClick = (itemId: string) => {
    // TODO: アイテム詳細画面への遷移（将来実装）
    console.log('Item clicked:', itemId)
  }

  const handleCreateSuccess = async () => {
    // アイテム作成成功時はAPIから再取得
    await fetchItems()
    await fetchGroup()
  }

  const handleDeleteClick = (itemId: string) => {
    setDeleteTargetIds([itemId])
    setDeleteDialogOpen(true)
  }

  const handleBulkDeleteClick = (itemIds: string[]) => {
    setDeleteTargetIds(itemIds)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deleteTargetIds.length === 0) return

    setIsDeleting(true)
    setError(null)

    try {
      if (deleteTargetIds.length === 1) {
        // 個別削除
        await customInstance.delete(`/api/items/${deleteTargetIds[0]}`)
      } else {
        // 一括削除
        await customInstance.delete('/api/items', {
          data: { ids: deleteTargetIds },
        })
      }

      // 削除成功後、アイテム一覧を再取得
      await fetchItems()
      await fetchGroup()
      setDeleteDialogOpen(false)
      setDeleteTargetIds([])

      // 削除モードをOFFにする（一括削除の場合）
      if (deleteTargetIds.length > 1) {
        setIsDeleteMode(false)
      }
    } catch (err) {
      console.error('Failed to delete items:', err)
      let errorMessage = 'アイテムの削除に失敗しました'
      if (
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
      ) {
        errorMessage = err.response.data.message
      }
      setError(errorMessage)
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <BackButton to="/" label="グループ一覧に戻る" />
        <HeroSection
          title={group?.name || '読み込み中...'}
          description={
            group?.description ||
            (isLoading
              ? '読み込み中...'
              : itemCount > 0
                ? `${itemCount}件のアイテム`
                : 'アイテムがありません')
          }
        />
        <div className="flex gap-2.5 mb-4 md:mb-5">
          {!isDeleteMode ? (
            <>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                aria-label="新しいアイテムを作成"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="text-sm md:text-base font-medium">
                  新規作成
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteMode(true)}
                className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                aria-label="削除を開始"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="text-sm md:text-base font-medium">削除</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsDeleteMode(false)}
              className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              aria-label="削除モードを終了"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
              <span className="text-sm md:text-base font-medium">
                削除モードを終了
              </span>
            </button>
          )}
        </div>
        <SearchBar
          onSearchChange={setSearchQuery}
          placeholder="アイテムで検索"
        />
        <section aria-label="アイテム一覧" className="pb-4 md:pb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm md:text-base">
                読み込み中...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2 text-sm md:text-base">{error}</p>
              <button
                type="button"
                onClick={handleCreateSuccess}
                className="text-teal-600 hover:text-teal-700 text-sm md:text-base"
              >
                再読み込み
              </button>
            </div>
          ) : (
            <ItemGrid
              items={items}
              onItemClick={handleItemClick}
              searchQuery={searchQuery}
              isDeleteMode={isDeleteMode}
              onDelete={handleDeleteClick}
              onBulkDelete={handleBulkDeleteClick}
            />
          )}
        </section>
      </main>
      {groupId && (
        <ItemCreateModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          defaultGroupIds={[groupId]}
          onSuccess={handleCreateSuccess}
        />
      )}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="アイテムを削除しますか？"
        message={
          deleteTargetIds.length === 1
            ? 'この操作は取り消せません。'
            : '選択したアイテムを削除します。この操作は取り消せません。'
        }
        itemCount={deleteTargetIds.length}
        isLoading={isDeleting}
      />
    </div>
  )
}
