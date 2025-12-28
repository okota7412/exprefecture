import { X } from 'lucide-react'

import { PrefectureMap } from './PrefectureMap'

type MapModalProps = {
  isOpen: boolean
  onClose: () => void
  onRegionClick: (regionId: string) => void
}

export const MapModal = ({ isOpen, onClose, onRegionClick }: MapModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="document"
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <h2 id="map-modal-title" className="text-xl font-bold text-gray-900">
            地図で地方を選ぶ
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="ダイアログを閉じる"
          >
            <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 md:p-6">
          <p className="text-sm text-gray-600 mb-3">
            地図上の地方にマウスを乗せると地方全体が強調表示されます。クリックして地方の詳細を表示できます。
          </p>
          <div className="bg-gray-50 rounded-lg p-2 md:p-4">
            <div className="h-[400px] md:h-[500px]">
              <PrefectureMap
                mode="region"
                onRegionClick={regionId => {
                  onRegionClick(regionId)
                  onClose()
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
