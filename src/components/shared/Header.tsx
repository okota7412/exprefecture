import { MapPin, Home, ArrowLeft, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

type HeaderProps = {
  showBackButton?: boolean
  backPath?: string
  backLabel?: string
}

export const Header = ({
  backLabel = 'ホーム',
  backPath = '/',
  showBackButton = false,
}: HeaderProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()
  const isHome = location.pathname === '/'
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
      className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md"
      role="banner"
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded"
            aria-label="WannaGo ホーム"
          >
            <div className="bg-white/20 rounded-lg p-1.5 md:p-2">
              <MapPin className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              WannaGo
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            {showBackButton && !isHome && (
              <Link
                to={backPath}
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                aria-label={backLabel}
              >
                <ArrowLeft
                  className="w-4 h-4 md:w-5 md:h-5"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline text-sm md:text-base">
                  {backLabel}
                </span>
              </Link>
            )}
            {!isHome && !showBackButton && !isLoginPage && !isSignupPage && (
              <Link
                to="/"
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                aria-label="ホームに戻る"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="hidden sm:inline text-sm md:text-base">
                  ホーム
                </span>
              </Link>
            )}
            {!isLoginPage && !isSignupPage && (
              <button
                onClick={handleLogout}
                type="button"
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                aria-label="ログアウト"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="hidden sm:inline text-sm md:text-base">
                  ログアウト
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
