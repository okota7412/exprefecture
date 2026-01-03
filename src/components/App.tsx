import { Routes, Route, BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '@/contexts/AuthContext'

import { LoginPage } from './auth/LoginPage'
import { SignupPage } from './auth/SignupPage'
import { PrefectureHome } from './PrefectureHome'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RegionHome } from './RegionHome'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 認証ページ（未認証ユーザーのみアクセス可能） */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* 保護されたページ（認証が必要） */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RegionHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/regions/:regionId"
            element={
              <ProtectedRoute>
                <PrefectureHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prefectures/:prefectureId"
            element={
              <ProtectedRoute>
                <div>Prefecture Detail (TODO)</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
