import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { getItemsByPrefecture } from '@/data/items'
import { prefectures } from '@/data/prefectures'
import { getRegionById } from '@/data/regions'

import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { ItemGrid } from './shared/ItemGrid'
import { SearchBar } from './shared/SearchBar'

export const PrefectureDetail = () => {
  const { prefectureId } = useParams<{ prefectureId: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

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

  const prefectureIdNum = parseInt(prefectureId, 10)
  const prefecture = prefectures.find(p => p.id === prefectureIdNum)

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

  const items = getItemsByPrefecture(prefectureIdNum)
  const itemCount = items.length

  const handleItemClick = (itemId: number) => {
    // TODO: アイテム詳細画面への遷移（将来実装）
    console.log('Item clicked:', itemId)
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
            itemCount > 0 ? `${itemCount}件のアイテム` : 'アイテムがありません'
          }
        />
        <SearchBar
          onSearchChange={setSearchQuery}
          placeholder="アイテムで検索"
        />
        <section aria-label="アイテム一覧" className="pb-4 md:pb-6">
          <ItemGrid
            items={items}
            onItemClick={handleItemClick}
            searchQuery={searchQuery}
          />
        </section>
      </main>
    </div>
  )
}
