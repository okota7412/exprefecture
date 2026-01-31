import { Plus, Trash2, X } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import type { Item, ItemStatus, ItemTag } from '@/data/items'
import { prefectures } from '@/data/prefectures'
import { getRegionById } from '@/data/regions'

import { ItemCreateModal } from './ItemCreateModal'
import { ItemDetailModal } from './ItemDetailModal'
import { BackButton } from './shared/BackButton'
import { DeleteConfirmDialog } from './shared/DeleteConfirmDialog'
import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { ItemGrid } from './shared/ItemGrid'
import { SearchBar } from './shared/SearchBar'

export const PrefectureDetail = () => {
  const { prefectureId } = useParams<{ prefectureId: string }>()
  const navigate = useNavigate()
  const { currentAccountGroupId } = useAccountGroup()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const prefectureIdNum = prefectureId ? parseInt(prefectureId, 10) : null
  const prefecture =
    prefectureIdNum !== null
      ? prefectures.find(p => p.id === prefectureIdNum)
      : null

  const fetchItems = useCallback(async () => {
    if (!prefectureIdNum || !currentAccountGroupId) {
      console.log('[PrefectureDetail] fetchItems skipped:', {
        prefectureIdNum,
        currentAccountGroupId,
      })
      return
    }

    console.log('[PrefectureDetail] fetchItems:', {
      prefectureIdNum,
      currentAccountGroupId,
    })
    setIsLoading(true)
    setError(null)
    try {
      const response = await customInstance.get<Item[]>('/api/items', {
        params: {
          prefectureId: prefectureIdNum,
          accountGroupId: currentAccountGroupId,
        },
      })
      console.log(
        '[PrefectureDetail] fetchItems result:',
        response.data.length,
        'items'
      )

      if (response.data.length > 0 && process.env.NODE_ENV !== 'production') {
        console.log(
          '[PrefectureDetail] fetchItems items:',
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
  }, [prefectureIdNum, currentAccountGroupId])

  // APIからアイテムを取得
  useEffect(() => {
    console.log('[PrefectureDetail] useEffect:', {
      prefectureIdNum,
      prefecture: !!prefecture,
      currentAccountGroupId,
    })
    if (!prefectureIdNum || !prefecture || !currentAccountGroupId) {
      console.log(
        '[PrefectureDetail] useEffect: Skipping fetchItems (missing required values)'
      )
      setIsLoading(false)
      setItems([])
      return
    }

    fetchItems()
  }, [prefectureIdNum, prefecture, currentAccountGroupId, fetchItems])

  if (!prefectureId) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              都道府県が見つかりません
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

  if (!prefecture) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              都道府県が見つかりません
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

  // 都道府県の地方名から地方IDを取得
  const regionNameToIdMap: Record<string, string> = {
    北海道: 'hokkaido',
    東北: 'tohoku',
    関東: 'kanto',
    中部: 'chubu',
    近畿: 'kinki',
    中国: 'chugoku',
    四国: 'shikoku',
    九州: 'kyushu',
    沖縄: 'okinawa',
  }
  const regionId = regionNameToIdMap[prefecture.region]
  const region = regionId ? getRegionById(regionId) : undefined

  const itemCount = items.length

  const handleItemClick = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setDetailModalOpen(true)
    }
  }

  const handleCreateSuccess = async () => {
    // アイテム作成成功時はAPIから再取得
    await fetchItems()
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
        <BackButton
          to={region ? `/regions/${region.id}` : '/'}
          label={region ? `${region.name}地方に戻る` : 'ホームに戻る'}
        />
        <HeroSection
          title={prefecture.name}
          description={
            isLoading
              ? '読み込み中...'
              : itemCount > 0
                ? `${itemCount}件のアイテム`
                : 'アイテムがありません'
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
      <ItemDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        item={selectedItem}
      />
      {prefectureIdNum !== null && (
        <ItemCreateModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          prefectureId={prefectureIdNum}
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
