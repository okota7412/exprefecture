import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Header } from '@/components/shared/Header'
import { useAuth } from '@/contexts/AuthContext'

export const SignupPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // パスワード確認
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    // パスワードの最小長チェック
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。')
      return
    }

    setIsLoading(true)

    try {
      // 認証コンテキストのsignup関数を使用
      await signup(email, password)

      // サインアップ成功後、ホームページにリダイレクト
      navigate('/')
    } catch (err) {
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : '新規登録に失敗しました。入力内容を確認してください。'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              新規登録
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  パスワード
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="8文字以上"
                />
                <p className="mt-1 text-xs text-gray-500">
                  8文字以上のパスワードを入力してください
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  パスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="パスワードを再入力"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '登録中...' : '新規登録'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちの方は{' '}
                <Link
                  to="/login"
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  ログイン
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
