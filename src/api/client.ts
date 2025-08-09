import axios from 'axios'

export const customInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// リクエストインターセプター
customInstance.interceptors.request.use(
  config => {
    // 認証トークンがある場合は追加
    const token = localStorage.getItem('token')
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
customInstance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    // 401エラーの場合はログアウト処理
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
