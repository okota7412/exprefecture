import { Navigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  // ローディング中は何も表示しない
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // 既に認証されている場合はホームページにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // 未認証の場合は子コンポーネント（ログインページなど）を表示
  return <>{children}</>
}
