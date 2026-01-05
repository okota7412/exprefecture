import { useState } from 'react'
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

  const region = getRegionById(regionId)
  const prefectures = getPrefecturesByRegion(regionId)

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

  const prefectureItems = prefectures.map(prefecture => ({
    id: prefecture.id,
    title: prefecture.name,
    subtitle: prefecture.region,
    itemCount: getItemCountByPrefecture(prefecture.id),
    regionId: region.id,
  }))

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
