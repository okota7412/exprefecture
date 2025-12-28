import { ArrowLeft, MapPin } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

import { getRegionById, getPrefecturesByRegion } from '@/data/regions'

import { Header } from './Header'

export const RegionBoard = () => {
  const { regionId } = useParams<{ regionId: string }>()
  const navigate = useNavigate()

  if (!regionId) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              地方が見つかりません
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const region = getRegionById(regionId)
  const regionPrefectures = getPrefecturesByRegion(regionId)

  if (!region) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              地方が見つかりません
            </h1>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handlePrefectureClick = (prefectureId: number) => {
    navigate(`/prefectures/${prefectureId}`)
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto container mx-auto px-4 py-2 md:py-3">
        {/* ヘッダー */}
        <div className="mb-3 md:mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-3 transition-colors group text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="日本地図に戻る"
          >
            <ArrowLeft
              className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform"
              aria-hidden="true"
            />
            <span>日本地図に戻る</span>
          </button>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 md:p-2.5">
                <MapPin
                  className="w-4 h-4 md:w-5 md:h-5 text-white"
                  aria-hidden="true"
                />
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                {region.name}地方
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-10 md:ml-12">
              {regionPrefectures.length}都道府県
            </p>
          </div>
        </div>

        {/* 都道府県一覧（地図は削除、カードのみ） */}
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
            都道府県一覧
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {regionPrefectures.map(prefecture => {
              return (
                <button
                  key={prefecture.id}
                  type="button"
                  onClick={() => handlePrefectureClick(prefecture.id)}
                  className="group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
                  aria-label={`${prefecture.name}を選択`}
                >
                  <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {prefecture.name}
                  </h3>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
