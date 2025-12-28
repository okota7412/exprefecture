import { Search, Map } from 'lucide-react'
import { useState } from 'react'

type SearchBarProps = {
  onSearchChange: (query: string) => void
  onMapClick?: () => void
  placeholder?: string
}

export const SearchBar = ({
  onMapClick,
  onSearchChange,
  placeholder = '地方や都道府県で検索',
}: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearchChange(value)
  }

  return (
    <div className="flex gap-2.5 mb-4 md:mb-5">
      <div className="flex-1 relative">
        <label htmlFor="search-input" className="sr-only">
          検索
        </label>
        <input
          id="search-input"
          type="search"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleChange}
          className="w-full px-4 md:px-5 py-3 md:py-3.5 pl-11 md:pl-12 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-gray-300 text-sm md:text-base bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200"
          aria-label="地方や都道府県で検索"
        />
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400"
          aria-hidden="true"
        />
      </div>
      {onMapClick && (
        <button
          type="button"
          onClick={onMapClick}
          className="px-4 md:px-5 py-3 md:py-3.5 bg-white border border-gray-200/60 rounded-xl hover:bg-gray-50/50 active:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 flex items-center gap-2 text-sm md:text-base font-normal text-gray-700 whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          aria-label="地図で選ぶ"
        >
          <Map className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          <span className="hidden sm:inline">地図</span>
        </button>
      )}
    </div>
  )
}
