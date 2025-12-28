// 地方ごとの色定義（立地をイメージした色）
export const regionColors: Record<
  string,
  {
    bg: string
    bgHover: string
    border: string
    text: string
    accent: string
  }
> = {
  hokkaido: {
    bg: 'bg-blue-50/50',
    bgHover: 'bg-blue-50',
    border: 'border-blue-200/60',
    text: 'text-blue-950',
    accent: 'text-blue-600',
  },
  tohoku: {
    bg: 'bg-green-50/50',
    bgHover: 'bg-green-50',
    border: 'border-green-200/60',
    text: 'text-green-950',
    accent: 'text-green-600',
  },
  kanto: {
    bg: 'bg-red-50/50',
    bgHover: 'bg-red-50',
    border: 'border-red-200/60',
    text: 'text-red-950',
    accent: 'text-red-600',
  },
  chubu: {
    bg: 'bg-orange-50/50',
    bgHover: 'bg-orange-50',
    border: 'border-orange-200/60',
    text: 'text-orange-950',
    accent: 'text-orange-600',
  },
  kinki: {
    bg: 'bg-purple-50/50',
    bgHover: 'bg-purple-50',
    border: 'border-purple-200/60',
    text: 'text-purple-950',
    accent: 'text-purple-600',
  },
  chugoku: {
    bg: 'bg-lime-50/50',
    bgHover: 'bg-lime-50',
    border: 'border-lime-200/60',
    text: 'text-lime-950',
    accent: 'text-lime-600',
  },
  shikoku: {
    bg: 'bg-cyan-50/50',
    bgHover: 'bg-cyan-50',
    border: 'border-cyan-200/60',
    text: 'text-cyan-950',
    accent: 'text-cyan-600',
  },
  kyushu: {
    bg: 'bg-rose-50/50',
    bgHover: 'bg-rose-50',
    border: 'border-rose-200/60',
    text: 'text-rose-950',
    accent: 'text-rose-600',
  },
  okinawa: {
    bg: 'bg-sky-50/50',
    bgHover: 'bg-sky-50',
    border: 'border-sky-200/60',
    text: 'text-sky-950',
    accent: 'text-sky-600',
  },
}

export const getRegionColor = (regionId: string) => {
  return regionColors[regionId] || regionColors.hokkaido
}
