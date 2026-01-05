import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { customInstance } from '@/api/client'
import type { Item, ItemStatus, ItemTag } from '@/data/items'
import { prefectures } from '@/data/prefectures'
import { getRegionById } from '@/data/regions'

import { ItemCreateModal } from './ItemCreateModal'
import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { ItemGrid } from './shared/ItemGrid'
import { SearchBar } from './shared/SearchBar'

export const PrefectureDetail = () => {
  const { prefectureId } = useParams<{ prefectureId: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const prefectureIdNum = prefectureId ? parseInt(prefectureId, 10) : null
  const prefecture =
    prefectureIdNum !== null
      ? prefectures.find(p => p.id === prefectureIdNum)
      : null

  // APIからアイテムを取得
  useEffect(() => {
    if (!prefectureIdNum || !prefecture) {
      setIsLoading(false)
      setItems([])
      return
    }

    const fetchItems = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await customInstance.get<Item[]>('/api/items', {
          params: { prefectureId: prefectureIdNum },
        })
        // APIレスポンスをItem型に変換
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
    }

    fetchItems()
  }, [prefectureIdNum, prefecture])

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
              className="text-blue-600 hover:text-blue-700 font-medium"
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
              className="text-blue-600 hover:text-blue-700 font-medium"
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
    // TODO: アイテム詳細画面への遷移（将来実装）
    console.log('Item clicked:', itemId)
  }

  const handleCreateSuccess = async () => {
    // アイテム作成成功時はAPIから再取得
    setIsLoading(true)
    setError(null)
    try {
      const response = await customInstance.get<Item[]>('/api/items', {
        params: { prefectureId: prefectureIdNum },
      })
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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header
        showBackButton
        backPath={region ? `/regions/${region.id}` : '/'}
        backLabel={region ? `${region.name}地方に戻る` : 'ホームに戻る'}
      />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
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
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            aria-label="新しいアイテムを作成"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            <span className="text-sm md:text-base font-medium">新規作成</span>
          </button>
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
                className="text-blue-600 hover:text-blue-700 text-sm md:text-base"
              >
                再読み込み
              </button>
            </div>
          ) : (
            <ItemGrid
              items={items}
              onItemClick={handleItemClick}
              searchQuery={searchQuery}
            />
          )}
        </section>
      </main>
      {prefectureIdNum !== null && (
        <ItemCreateModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          prefectureId={prefectureIdNum}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}
