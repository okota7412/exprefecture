import { LogOut } from 'lucide-react'
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

  // デバッグ用（開発環境でのみ）
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    console.log('Header - isAuthenticated:', isAuthenticated, 'user:', user)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
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

        {/* アカウント名とログアウトボタン（右上） */}
        <div className="flex items-center gap-2 md:gap-3">
          {!isLoginPage && !isSignupPage && user && (
            <>
              <NotificationButton />
              <AccountGroupSelector />
              <div className="text-sm md:text-base font-medium text-gray-700 truncate max-w-[160px] md:max-w-[200px] hidden sm:block">
                {user.email || `ユーザーID: ${user.userId}`}
              </div>
              <button
                onClick={handleLogout}
                type="button"
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-gray-700 hover:text-teal-700 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                aria-label="ログアウト"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="hidden sm:inline text-sm md:text-base font-medium">
                  ログアウト
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
