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
      className={`group relative w-full h-full ${colors.bg} ${colors.border} rounded-xl border p-4 md:p-5 lg:p-6 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 active:scale-[0.98] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] ${
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
          : 'shadow-[0_2px_4px_rgba(0,0,0,0.06)]'
      }`}
      aria-label={`${title}を選択${itemCount !== undefined ? `（${itemCount}件のアイテム）` : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex-1">
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
                                : colors.accent === 'text-sky-600'
                                  ? 'group-hover:text-sky-600'
                                  : 'group-hover:text-gray-600'
              }`}
            >
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs md:text-sm ${colors.text}/70 mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          {subtitle && !itemCount && (
            <span
              className={`text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-medium flex-shrink-0 ${colors.bgHover} ${colors.accent}`}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* データ件数表示 */}
        {itemCount !== undefined && (
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
        )}
      </div>
    </button>
  )
}
