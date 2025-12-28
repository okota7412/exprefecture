import { SelectionCard } from './SelectionCard'

type SelectionItem = {
  id: string | number
  title: string
  subtitle?: string
  itemCount?: number
  regionId?: string
}

type SelectionGridProps = {
  items: SelectionItem[]
  onItemClick: (id: string | number) => void
  searchQuery?: string
  sectionTitle?: string
}

export const SelectionGrid = ({
  items,
  onItemClick,
  searchQuery = '',
  sectionTitle,
}: SelectionGridProps) => {
  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  if (filteredItems.length === 0) {
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
      {sectionTitle && (
        <h2 className="text-xs md:text-sm font-normal text-gray-500 mb-4 md:mb-5">
          {sectionTitle}
        </h2>
      )}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        role="list"
        aria-label={sectionTitle || '選択一覧'}
      >
        {filteredItems.map(item => (
          <div key={item.id} role="listitem" className="h-[140px] md:h-[160px]">
            <SelectionCard
              id={item.id}
              title={item.title}
              subtitle={item.subtitle}
              itemCount={item.itemCount}
              regionId={item.regionId}
              onClick={onItemClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
