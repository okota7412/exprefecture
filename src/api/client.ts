import axios from 'axios'

export const customInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookieを送信するために必要
})

// Cookieから値を取得するヘルパー関数
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

// CSRFトークンを取得する関数（Cookieから取得、なければAPIから取得）
let csrfTokenPromise: Promise<string> | null = null

const getCsrfToken = async (): Promise<string | null> => {
  // Cookieから取得を試みる
  const cookieToken = getCookieValue('csrf-token')
  if (cookieToken) {
    return cookieToken
  }

  // Cookieにない場合、既に取得中の場合はそのPromiseを返す
  if (csrfTokenPromise) {
    return csrfTokenPromise
  }

  // APIから取得（GETメソッドなのでCSRF検証はスキップされる）
  csrfTokenPromise = customInstance
    .get('/api/auth/csrf-token')
    .then(response => {
      return response.data.csrfToken
    })
    .finally(() => {
      csrfTokenPromise = null
    })

  return csrfTokenPromise
}

// リクエストインターセプター
customInstance.interceptors.request.use(
  async config => {
    // 認証トークンがある場合は追加
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // CSRFトークンを取得してヘッダーに設定
    // GET, HEAD, OPTIONSメソッドはCSRF検証が不要だが、設定しても問題ない
    // CSRFトークンエンドポイント自体はGETなので、再帰的呼び出しにはならない
    if (!config.url?.includes('/api/auth/csrf-token')) {
      try {
        const csrfToken = await getCsrfToken()
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken
        }
      } catch (error) {
        // CSRFトークン取得に失敗しても続行（バックエンドが初回リクエストを許可するため）
        console.warn('Failed to get CSRF token:', error)
      }
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// レスポンスインターセプター
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

customInstance.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    // リフレッシュエンドポイント自体へのリクエストが401を返した場合は、リトライしない
    const isRefreshEndpoint = originalRequest.url?.includes('/api/auth/refresh')
    if (isRefreshEndpoint && error.response?.status === 401) {
      // リフレッシュトークンがない場合は、そのままエラーを返す
      return Promise.reject(error)
    }

    // 401エラーで、まだリトライしていない場合
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 既にリフレッシュ中の場合、キューに追加
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return customInstance(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // リフレッシュトークンで新しいアクセストークンを取得
        const response = await customInstance.post('/api/auth/refresh')
        const newAccessToken = response.data.accessToken
        sessionStorage.setItem('accessToken', newAccessToken)

        // キューを処理
        processQueue(null, newAccessToken)

        // 元のリクエストを再試行
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return customInstance(originalRequest)
      } catch (refreshError) {
        // リフレッシュに失敗した場合
        processQueue(refreshError, null)
        sessionStorage.removeItem('accessToken')
        // リフレッシュエンドポイントへのリクエストが失敗した場合は、ログインページにリダイレクトしない
        // （AuthContextで処理される）
        if (!isRefreshEndpoint) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
