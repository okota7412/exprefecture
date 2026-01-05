import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { regions } from '@/data/regions'
import { getItemCountByRegion } from '@/utils/itemCount'

import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { SearchBar } from './shared/SearchBar'
import { SelectionGrid } from './shared/SelectionGrid'

export const RegionHome = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [regionItems, setRegionItems] = useState<
    Array<{
      id: string
      title: string
      subtitle: string
      itemCount: number
      regionId: string
    }>
  >([])

  const handleRegionClick = (regionId: string | number) => {
    navigate(`/regions/${regionId}`)
  }

  // APIからアイテム数を取得
  useEffect(() => {
    const fetchItemCounts = async () => {
      try {
        const items = await Promise.all(
          regions.map(async region => ({
            id: region.id,
            title: region.name,
            subtitle: `${region.prefectureIds.length}県`,
            itemCount: await getItemCountByRegion(region.id),
            regionId: region.id,
          }))
        )
        setRegionItems(items)
      } catch (error) {
        console.error('Failed to fetch item counts:', error)
        // エラー時は0件として表示
        setRegionItems(
          regions.map(region => ({
            id: region.id,
            title: region.name,
            subtitle: `${region.prefectureIds.length}県`,
            itemCount: 0,
            regionId: region.id,
          }))
        )
      }
    }

    fetchItemCounts()
  }, [])

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <HeroSection />
        <SearchBar onSearchChange={setSearchQuery} />
        <section aria-label="地方一覧" className="pb-4 md:pb-6">
          <SelectionGrid
            items={regionItems}
            onItemClick={handleRegionClick}
            searchQuery={searchQuery}
            sectionTitle="地方を選ぶ"
          />
        </section>
      </main>
    </div>
  )
}
