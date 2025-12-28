import { useEffect, useRef } from 'react'

import { prefectures } from '@/data/prefectures'
import { regions } from '@/data/regions'

const MAP_PATH = '/src/assets/map-full.svg'
const COLORS = {
  hover: '#3b82f6',
  default: '#333333',
  stroke: '#666666',
  regionHover: '#60a5fa',
}

type PrefectureMapProps = {
  onRegionClick?: (regionId: string) => void
  onPrefectureClick?: (prefectureId: number) => void
  mode?: 'region' | 'prefecture' // 地方モード or 都道府県モード
}

export const PrefectureMap = ({
  mode = 'region',
  onPrefectureClick,
  onRegionClick,
}: PrefectureMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMap = async () => {
      const container = containerRef.current
      try {
        const res = await fetch(MAP_PATH)
        if (res.ok && container) {
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

          if (mode === 'region') {
            // 地方モード：地方ごとにグループ化してクリック可能にする
            prefs.forEach(pref => {
              const code = pref.dataset.code
              const prefectureId = parseInt(code || '0')
              const prefecture = prefectures.find(p => p.id === prefectureId)

              if (!prefecture) return

              // 都道府県が属する地方を取得
              const region = regions.find(r =>
                r.prefectureIds.includes(prefectureId)
              )

              if (!region) return

              // 初期値設定
              pref.setAttribute('fill', COLORS.default)
              pref.setAttribute('stroke', COLORS.stroke)
              pref.style.cursor = 'pointer'
              pref.style.transition = 'all 0.2s ease'

              // マウスオーバーで色を変える（地方全体を強調）
              pref.addEventListener('mouseover', () => {
                // 同じ地方の都道府県をすべて強調
                prefs.forEach(p => {
                  const pid = parseInt(p.dataset.code || '0')
                  if (region.prefectureIds.includes(pid)) {
                    p.style.fill = COLORS.regionHover
                    p.style.stroke = COLORS.hover
                    p.style.strokeWidth = '2'
                  }
                })
              })

              // マウスが離れたら色をもとに戻す
              pref.addEventListener('mouseleave', () => {
                prefs.forEach(p => {
                  p.style.fill = COLORS.default
                  p.style.stroke = COLORS.stroke
                  p.style.strokeWidth = '1'
                })
              })

              // マウスクリック時のイベント（地方に遷移）
              pref.addEventListener('click', () => {
                if (onRegionClick) {
                  onRegionClick(region.id)
                }
              })
            })
          } else {
            // 都道府県モード：個別の都道府県をクリック可能にする
            prefs.forEach(pref => {
              const code = pref.dataset.code
              const prefectureId = parseInt(code || '0')
              const prefecture = prefectures.find(p => p.id === prefectureId)

              if (!prefecture) return

              // 初期値設定
              pref.setAttribute('fill', COLORS.default)
              pref.setAttribute('stroke', COLORS.stroke)
              pref.style.cursor = 'pointer'
              pref.style.transition = 'all 0.2s ease'

              // マウスオーバーで色を変える
              pref.addEventListener('mouseover', () => {
                pref.style.fill = COLORS.hover
                pref.style.stroke = COLORS.hover
                pref.style.strokeWidth = '2'
              })

              // マウスが離れたら色をもとに戻す
              pref.addEventListener('mouseleave', () => {
                pref.style.fill = COLORS.default
                pref.style.stroke = COLORS.stroke
                pref.style.strokeWidth = '1'
              })

              // マウスクリック時のイベント（都道府県に遷移）
              pref.addEventListener('click', () => {
                if (onPrefectureClick && prefectureId > 0) {
                  onPrefectureClick(prefectureId)
                }
              })
            })
          }
        }
      } catch (error) {
        console.error('エラーが発生しました：', error)
      }
    }

    loadMap()
  }, [mode, onRegionClick, onPrefectureClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-full max-w-4xl mx-auto flex items-center justify-center"
    />
  )
}
