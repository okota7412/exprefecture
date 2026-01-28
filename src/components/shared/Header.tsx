import { LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import ikottoStringIcon from '@/assets/ikotto_stringIcon.png'
import { useAuth } from '@/contexts/AuthContext'

import { AccountGroupSelector } from './AccountGroupSelector'
import { NotificationButton } from './NotificationButton'

export const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const isLoginPage = location.pathname === '/login'
  const isSignupPage = location.pathname === '/signup'
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // デバッグ用（開発環境でのみ）
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log('Header - isAuthenticated:', isAuthenticated, 'user:', user)
  }

  // クリックアウトサイドでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // ユーザーのイニシャルを取得（アバター表示用）
  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <header
      className="bg-white border-b border-gray-100 shadow-sm"
      role="banner"
    >
      <div className="flex items-center justify-between py-3 md:py-4 px-4 md:px-6">
        {/* ロゴ（文字アイコンのみ・ヘッダーの主役） */}
        <Link
          to="/"
          className="flex items-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg -ml-1"
          aria-label="いこっと ホーム"
        >
          <img
            src={ikottoStringIcon}
            alt="いこっと"
            className="h-12 md:h-14 w-auto object-contain object-left"
          />
        </Link>

        {/* 通知とユーザーメニュー（右上） */}
        <div className="flex items-center gap-2 md:gap-3">
          {!isLoginPage && !isSignupPage && user && (
            <>
              <NotificationButton />
              <AccountGroupSelector />
              {/* ユーザーメニュー */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  type="button"
                  className="flex items-center gap-2 px-3 md:px-3 py-1.5 md:py-2 text-gray-700 hover:text-teal-700 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  aria-label="ユーザーメニュー"
                  aria-expanded={isUserMenuOpen}
                >
                  {/* アバター */}
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                    {getUserInitial()}
                  </div>
                  <span className="hidden sm:inline text-sm md:text-base font-medium truncate max-w-[160px] md:max-w-[200px]">
                    {user.email || `ユーザーID: ${user.userId}`}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {/* ドロップダウンメニュー */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {/* ユーザー情報 */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                            {getUserInitial()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email || `ユーザーID: ${user.userId}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              アカウント
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* ログアウト */}
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        aria-label="ログアウト"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span className="font-medium">ログアウト</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
