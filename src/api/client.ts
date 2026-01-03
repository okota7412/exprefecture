import axios from 'axios'

export const customInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookieを送信するために必要
})

// リクエストインターセプター
customInstance.interceptors.request.use(
  config => {
    // 認証トークンがある場合は追加
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
