import { useEffect, useRef } from 'react'

import { prefectures } from '@/data/prefectures'
import type { Region } from '@/data/regions'

const MAP_PATH = '/src/assets/map-full.svg'
const COLORS = {
  hover: '#3b82f6',
  default: '#333333',
  stroke: '#666666',
  regionHighlight: '#60a5fa',
}

type RegionMapProps = {
  region: Region
  onPrefectureClick?: (prefectureId: number) => void
}

export const RegionMap = ({ onPrefectureClick, region }: RegionMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMap = async () => {
      const container = containerRef.current
      if (!container) return

      try {
        const res = await fetch(MAP_PATH)
        if (res.ok) {
          const svg = await res.text()
          container.innerHTML = svg

          // SVG要素をレスポンシブにする
          const svgElement =
            container.querySelector<SVGSVGElement>('.geolonia-svg-map')
          if (svgElement) {
            svgElement.setAttribute('width', '100%')
            svgElement.setAttribute('height', '100%')
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
            svgElement.style.display = 'block'
          }

          const prefs = container.querySelectorAll<HTMLElement>(
            '.geolonia-svg-map .prefecture'
          )

          prefs.forEach(pref => {
            const code = pref.dataset.code
            const prefectureId = parseInt(code || '0')
            const prefecture = prefectures.find(p => p.id === prefectureId)
            const isInRegion = region.prefectureIds.includes(prefectureId)

            if (!prefecture) return

            // 初期値設定
            if (isInRegion) {
              // この地方の県は強調表示
              pref.setAttribute('fill', COLORS.regionHighlight)
              pref.setAttribute('stroke', COLORS.hover)
              pref.setAttribute('stroke-width', '2')
            } else {
              // 他の地方の県は薄く表示
              pref.setAttribute('fill', '#e5e7eb')
              pref.setAttribute('stroke', '#d1d5db')
              pref.setAttribute('stroke-width', '1')
            }

            pref.style.cursor = isInRegion ? 'pointer' : 'default'
            pref.style.transition = 'all 0.2s ease'
            pref.setAttribute('aria-label', `${prefecture.name}をクリック`)

            if (isInRegion) {
              // マウスオーバーで色を変える
              pref.addEventListener('mouseover', () => {
                pref.style.fill = COLORS.hover
                pref.style.stroke = COLORS.hover
                pref.style.strokeWidth = '3'
                pref.style.filter = 'brightness(1.1)'
              })

              // マウスが離れたら色をもとに戻す
              pref.addEventListener('mouseleave', () => {
                pref.style.fill = COLORS.regionHighlight
                pref.style.stroke = COLORS.hover
                pref.style.strokeWidth = '2'
                pref.style.filter = 'brightness(1)'
              })

              // マウスクリック時のイベント
              pref.addEventListener('click', () => {
                if (onPrefectureClick && prefectureId > 0) {
                  onPrefectureClick(prefectureId)
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('エラーが発生しました：', error)
      }
    }

    loadMap()
  }, [region, onPrefectureClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] md:h-[600px] max-w-4xl mx-auto flex items-center justify-center"
      role="img"
      aria-label={`${region.name}地方の地図`}
    />
  )
}
