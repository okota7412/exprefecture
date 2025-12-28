import { MapPin, ArrowLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

import { prefectures } from '@/data/prefectures'

import { Header } from './Header'

export const PrefectureBoard = () => {
  const { prefectureId } = useParams<{ prefectureId: string }>()
  const navigate = useNavigate()

  const prefectureIdNum = prefectureId ? parseInt(prefectureId, 10) : 0
  const prefecture = prefectures.find(p => p.id === prefectureIdNum)

  if (!prefecture) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              都道府県が見つかりません
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
            aria-label="都道府県一覧に戻る"
          >
            <ArrowLeft
              className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform"
              aria-hidden="true"
            />
            <span>都道府県一覧に戻る</span>
          </button>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 md:gap-3 mb-1">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 md:p-2.5">
                    <MapPin
                      className="w-4 h-4 md:w-5 md:h-5 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    {prefecture.name}
                  </h1>
                </div>
                <p className="text-sm text-gray-600 ml-10 md:ml-12">
                  {prefecture.region}
                </p>
              </div>
              <button
                type="button"
                className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="新しいアイテムを追加"
              >
                <span>追加</span>
              </button>
            </div>
          </div>
        </div>

        {/* アイテム一覧 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 md:p-12 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <MapPin
              className="w-6 h-6 md:w-8 md:h-8 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <p className="text-gray-600 text-base md:text-lg mb-3 md:mb-4">
            まだアイテムが登録されていません
          </p>
          <button
            type="button"
            className="px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md text-sm md:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            最初のアイテムを追加
          </button>
        </div>
      </div>
    </div>
  )
}
