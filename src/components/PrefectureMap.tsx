import { useEffect, useRef } from 'react'

import { prefectures } from '@/data/prefectures'

const MAP_PATH = '/src/assets/map-full.svg'
const COLORS = {
  hover: '#3b82f6',
  default: '#333333',
  stroke: '#666666',
}

export const PrefectureMap = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMap = async () => {
      const container = containerRef.current
      try {
        const res = await fetch(MAP_PATH)
        if (res.ok && container) {
          const svg = await res.text()
          container.innerHTML = svg
          const prefs = container.querySelectorAll<HTMLElement>(
            '.geolonia-svg-map .prefecture'
          )
          prefs.forEach(pref => {
            //初期値設定
            pref.setAttribute('fill', COLORS.default)
            pref.setAttribute('stroke', COLORS.stroke)
            pref.style.cursor = 'pointer'
            // マウスオーバーで色を変える
            pref.addEventListener('mouseover', event => {
              const target = event.currentTarget as HTMLElement
              target.style.fill = COLORS.hover
            })
            // マウスが離れたら色をもとに戻す
            pref.addEventListener('mouseleave', event => {
              const target = event.currentTarget as HTMLElement
              target.style.fill = COLORS.default
            })
            // マウスクリック時のイベント
            pref.addEventListener('click', event => {
              const target = event.currentTarget as HTMLElement
              const code = target.dataset.code

              const prefecture = prefectures.find(
                p => p.id === parseInt(code || '0')
              )
              console.log(prefecture)
            })
          })
        }
      } catch (error) {
        console.error('エラーが発生しました：', error)
      }
    }

    loadMap()
  }, [])

  return <div ref={containerRef} className="w-full max-w-4xl mx-auto" />
}
