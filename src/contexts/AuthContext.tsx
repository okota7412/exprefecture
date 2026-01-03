import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'

import { customInstance } from '@/api/client'

interface User {
  userId: string
  email?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // アクセストークンをリフレッシュ
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await customInstance.post('/api/auth/refresh')
      const newAccessToken = response.data.accessToken
      setAccessToken(newAccessToken)
      sessionStorage.setItem('accessToken', newAccessToken)

      // ユーザー情報も取得
      try {
        const userResponse = await customInstance.get('/api/auth/me')
        setUser(userResponse.data)
      } catch (error) {
        console.error('Failed to get user info after refresh:', error)
      }
      return true
    } catch (error) {
      // リフレッシュに失敗した場合はログアウト状態にする
      // 401エラー（リフレッシュトークンがない）は正常な状態なので、エラーをログに出力しない
      const status = (error as { response?: { status?: number } })?.response
        ?.status
      if (status !== 401) {
        console.error('Failed to refresh token:', error)
      }
      setAccessToken(null)
      setUser(null)
      sessionStorage.removeItem('accessToken')
      return false
    }
  }, [])

  // 初期化時に認証状態を確認
  useEffect(() => {
    const initAuth = async () => {
      try {
        // セッションストレージからアクセストークンを取得
        const storedToken = sessionStorage.getItem('accessToken')
        if (storedToken) {
          setAccessToken(storedToken)
          // バックエンドAPIからユーザー情報を取得
          try {
            const response = await customInstance.get('/api/auth/me')
            setUser(response.data)
          } catch (error) {
            // トークンが無効な場合はクリア
            const status = (error as { response?: { status?: number } })
              ?.response?.status
            if (status !== 401) {
              console.error('Failed to get user info:', error)
            }
            setAccessToken(null)
            sessionStorage.removeItem('accessToken')
            // リフレッシュトークンで再試行（失敗しても問題なし）
            await refreshAccessToken()
          }
        } else {
          // アクセストークンがない場合、リフレッシュトークンで再取得を試みる
          // リフレッシュトークンがない場合（初回起動時など）は失敗しても問題なし
          await refreshAccessToken()
        }
      } catch (error) {
        // 初期化エラーは無視（リフレッシュトークンがない場合は正常）
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [refreshAccessToken])

  // ログイン処理
  const login = async (email: string, password: string) => {
    const response = await customInstance.post('/api/auth/login', {
      email,
      password,
    })

    const { accessToken: newAccessToken, user: userData } = response.data

    // トークンとユーザー情報を保存
    setAccessToken(newAccessToken)
    setUser(userData)
    sessionStorage.setItem('accessToken', newAccessToken)
    // リフレッシュトークンはCookieに自動保存される（バックエンドで設定）
  }

  // サインアップ処理
  const signup = async (email: string, password: string) => {
    const response = await customInstance.post('/api/auth/signup', {
      email,
      password,
    })

    const { accessToken: newAccessToken, user: userData } = response.data

    // トークンとユーザー情報を保存（自動ログイン）
    setAccessToken(newAccessToken)
    setUser(userData)
    sessionStorage.setItem('accessToken', newAccessToken)
    // リフレッシュトークンはCookieに自動保存される（バックエンドで設定）
  }

  // ログアウト処理
  const logout = async () => {
    try {
      // バックエンドAPIでセッションを無効化
      await customInstance.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // フロントエンド側の状態をクリア
      setAccessToken(null)
      setUser(null)
      sessionStorage.removeItem('accessToken')
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!accessToken && !!user,
    login,
    signup,
    logout,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
