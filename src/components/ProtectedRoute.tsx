import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // ローディング中は何も表示しない（またはローディングスピナーを表示）
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    // 現在のパスを保存して、ログイン後に戻れるようにする
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}
