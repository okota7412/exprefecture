import type { Region } from '@/data/regions'
import { getItemCountByRegion } from '@/utils/itemCount'
import { getRegionColor } from '@/utils/regionColors'

type RegionCardProps = {
  region: Region
  onClick: (regionId: string) => void
  isHighlighted?: boolean
}

export const RegionCard = ({
  isHighlighted = false,
  onClick,
  region,
}: RegionCardProps) => {
  const prefectureCount = region.prefectureIds.length
  const itemCount = getItemCountByRegion(region.id)
  const colors = getRegionColor(region.id)

  return (
    <button
      type="button"
      onClick={() => onClick(region.id)}
      className={`group relative w-full h-full ${colors.bg} ${colors.border} rounded-xl border p-4 md:p-5 lg:p-6 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 active:scale-[0.98] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] ${
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
                        : 'hover:bg-sky-50'
      } ${
        isHighlighted
          ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
          : 'shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
      }`}
      aria-label={`${region.name}地方を選択（${prefectureCount}県、${itemCount}件のアイテム）`}
    >
      <div className="flex flex-col h-full">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
          <h3
            className={`text-lg md:text-xl lg:text-2xl font-semibold ${colors.text} transition-colors flex-1 leading-tight ${
              colors.accent === 'text-blue-600'
                ? 'group-hover:text-blue-600'
                : colors.accent === 'text-green-600'
                  ? 'group-hover:text-green-600'
                  : colors.accent === 'text-red-600'
                    ? 'group-hover:text-red-600'
                    : colors.accent === 'text-orange-600'
                      ? 'group-hover:text-orange-600'
                      : colors.accent === 'text-purple-600'
                        ? 'group-hover:text-purple-600'
                        : colors.accent === 'text-lime-600'
                          ? 'group-hover:text-lime-600'
                          : colors.accent === 'text-cyan-600'
                            ? 'group-hover:text-cyan-600'
                            : colors.accent === 'text-rose-600'
                              ? 'group-hover:text-rose-600'
                              : 'group-hover:text-sky-600'
            }`}
          >
            {region.name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-medium flex-shrink-0 ${colors.bgHover} ${colors.accent}`}
          >
            {prefectureCount}県
          </span>
        </div>

        {/* データ件数表示 */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <span
              className={`text-xl md:text-2xl lg:text-3xl font-semibold ${colors.accent}`}
            >
              {itemCount}
            </span>
            <span className={`text-xs md:text-sm ${colors.text}/70`}>
              件のアイテム
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
