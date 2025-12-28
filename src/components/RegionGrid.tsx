import { useMemo } from 'react'

import { regions } from '@/data/regions'

import { RegionCard } from './RegionCard'

type RegionGridProps = {
  searchQuery?: string
  onRegionClick: (regionId: string) => void
}

export const RegionGrid = ({
  onRegionClick,
  searchQuery = '',
}: RegionGridProps) => {
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions

    const query = searchQuery.toLowerCase()
    return regions.filter(region => region.name.toLowerCase().includes(query))
  }, [searchQuery])

  if (filteredRegions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2 text-sm md:text-base">
          見つかりませんでした
        </p>
        <p className="text-xs md:text-sm text-gray-500">
          別のキーワードで検索してください
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xs md:text-sm font-normal text-gray-500 mb-4 md:mb-5">
        地方を選ぶ
      </h2>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        role="list"
        aria-label="地方一覧"
      >
        {filteredRegions.map(region => (
          <div
            key={region.id}
            role="listitem"
            className="h-[140px] md:h-[160px]"
          >
            <RegionCard region={region} onClick={onRegionClick} />
          </div>
        ))}
      </div>
    </div>
  )
}
