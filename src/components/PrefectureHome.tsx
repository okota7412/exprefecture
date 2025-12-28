import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header } from './Header'
import { HeroSection } from './HeroSection'
import { MapModal } from './MapModal'
import { RegionGrid } from './RegionGrid'
import { SearchBar } from './SearchBar'

export const PrefectureHome = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  const handleRegionClick = (regionId: string) => {
    navigate(`/regions/${regionId}`)
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        {/* ヒーローセクション */}
        <HeroSection />

        {/* 検索バー + 地図ボタン */}
        <SearchBar
          onSearchChange={setSearchQuery}
          onMapClick={() => setIsMapModalOpen(true)}
        />

        {/* 地方カードグリッド */}
        <section aria-label="地方一覧" className="pb-4 md:pb-6">
          <RegionGrid
            searchQuery={searchQuery}
            onRegionClick={handleRegionClick}
          />
        </section>
      </main>

      {/* 地図モーダル */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onRegionClick={handleRegionClick}
      />
    </div>
  )
}
