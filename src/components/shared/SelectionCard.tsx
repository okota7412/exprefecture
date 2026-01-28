import { ChevronRight } from 'lucide-react'

import { getRegionColor } from '@/utils/regionColors'

type SelectionCardProps = {
  id: string | number
  title: string
  subtitle?: string
  itemCount?: number
  regionId?: string // 地方ID（色付け用）
  onClick: (id: string | number) => void
  isHighlighted?: boolean
}

export const SelectionCard = ({
  id,
  isHighlighted = false,
  itemCount,
  onClick,
  regionId,
  subtitle,
  title,
}: SelectionCardProps) => {
  // 地方IDが指定されている場合は地方色を使用、そうでなければデフォルト色
  const colors = regionId
    ? getRegionColor(regionId)
    : {
        bg: 'bg-gray-50/50',
        bgHover: 'bg-gray-50',
        border: 'border-gray-200/60',
        text: 'text-gray-950',
        accent: 'text-gray-600',
      }

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`group relative w-full h-full ${colors.bg} ${colors.border} rounded-xl border p-5 md:p-6 text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:ring-offset-2 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] hover:border-teal-300/50 ${
        colors.bgHover === 'bg-blue-50'
          ? 'hover:bg-blue-50'
          : colors.bgHover === 'bg-green-50'
            ? 'hover:bg-green-50'
            : colors.bgHover === 'bg-red-50'
              ? 'hover:bg-red-50'
              : colors.bgHover === 'bg-orange-50'
                ? 'hover:bg-orange-50'
                : colors.bgHover === 'bg-purple-50'
                  ? 'hover:bg-purple-50'
                  : colors.bgHover === 'bg-lime-50'
                    ? 'hover:bg-lime-50'
                    : colors.bgHover === 'bg-cyan-50'
                      ? 'hover:bg-cyan-50'
                      : colors.bgHover === 'bg-rose-50'
                        ? 'hover:bg-rose-50'
                        : colors.bgHover === 'bg-sky-50'
                          ? 'hover:bg-sky-50'
                          : 'hover:bg-gray-50'
      } ${
        isHighlighted
          ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
          : 'shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
      }`}
      aria-label={`${title}を選択${itemCount !== undefined ? `（${itemCount}件のアイテム）` : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-xl md:text-[20px] font-bold ${colors.text} transition-colors leading-tight group-hover:text-teal-700`}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className={`text-xs md:text-sm text-gray-500 mt-1.5 line-clamp-2`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {/* 矢印アイコン */}
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 flex-shrink-0 transition-colors mt-0.5" />
        </div>

        {/* データ件数表示 */}
        {itemCount !== undefined && (
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl md:text-3xl font-bold text-teal-600">
                {itemCount}
              </span>
              <span className="text-xs md:text-sm text-gray-500 font-normal">
                件
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
