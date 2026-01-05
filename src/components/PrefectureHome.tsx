import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { getRegionById, getPrefecturesByRegion } from '@/data/regions'
import { getItemCountByPrefecture } from '@/utils/itemCount'

import { BackButton } from './shared/BackButton'
import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { SearchBar } from './shared/SearchBar'
import { SelectionGrid } from './shared/SelectionGrid'

export const PrefectureHome = () => {
  const { regionId } = useParams<{ regionId: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [prefectureItems, setPrefectureItems] = useState<
    Array<{
      id: number
      title: string
      subtitle: string
      itemCount: number
      regionId: string
    }>
  >([])

  const region = regionId ? getRegionById(regionId) : null
  const prefectures = regionId ? getPrefecturesByRegion(regionId) : []

  // APIからアイテム数を取得
  useEffect(() => {
    if (!region || prefectures.length === 0) {
      return
    }

    const fetchItemCounts = async () => {
      try {
        const items = await Promise.all(
          prefectures.map(async prefecture => ({
            id: prefecture.id,
            title: prefecture.name,
            subtitle: prefecture.region,
            itemCount: await getItemCountByPrefecture(prefecture.id),
            regionId: region.id,
          }))
        )
        setPrefectureItems(items)
      } catch (error) {
        console.error('Failed to fetch item counts:', error)
        // エラー時は0件として表示
        setPrefectureItems(
          prefectures.map(prefecture => ({
            id: prefecture.id,
            title: prefecture.name,
            subtitle: prefecture.region,
            itemCount: 0,
            regionId: region.id,
          }))
        )
      }
    }

    fetchItemCounts()
  }, [region, prefectures])

  if (!regionId) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              地方が見つかりません
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

  if (!region) {
    return (
      <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              地方が見つかりません
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

  const handlePrefectureClick = (prefectureId: string | number) => {
    navigate(`/prefectures/${prefectureId}`)
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <BackButton to="/" label="地方一覧に戻る" />
        <HeroSection
          title={`${region.name}地方`}
          description={`${prefectures.length}都道府県から選ぶ`}
        />
        <SearchBar
          onSearchChange={setSearchQuery}
          placeholder="都道府県で検索"
        />
        <section aria-label="都道府県一覧" className="pb-4 md:pb-6">
          <SelectionGrid
            items={prefectureItems}
            onItemClick={handlePrefectureClick}
            searchQuery={searchQuery}
            sectionTitle="都道府県を選ぶ"
          />
        </section>
      </main>
    </div>
  )
}
