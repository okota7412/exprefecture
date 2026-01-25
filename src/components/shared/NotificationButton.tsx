import { Bell, Mail } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import type { AccountGroupInvitation } from '@/data/account-groups'
import { cn } from '@/lib/utils'

export const NotificationButton = () => {
  const { refreshAccountGroups } = useAccountGroup()
  const [isOpen, setIsOpen] = useState(false)
  const [invitations, setInvitations] = useState<AccountGroupInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await customInstance.get<AccountGroupInvitation[]>(
        '/api/account-groups/invitations',
        {
          params: { status: 'pending' },
        }
      )
      setInvitations(response.data)
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
      setError('招待の取得に失敗しました')
      setInvitations([])
    } finally {
      setIsLoading(false)
    }
  }

  // ドロップダウンが開かれた時に招待一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchInvitations()
    }
  }, [isOpen])

  // 定期的に招待数を更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvitations()
    }, 30000)

    // 初回読み込み
    fetchInvitations()

    return () => clearInterval(interval)
  }, [])

  // クリックアウトサイドで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleRespond = async (
    invitationId: string,
    action: 'accept' | 'reject'
  ) => {
    setProcessingId(invitationId)
    try {
      await customInstance.post('/api/account-groups/invitations/respond', {
        invitationId,
        action,
      })

      // 招待一覧を更新
      await fetchInvitations()

      // 承諾した場合はアカウントグループ一覧も更新
      if (action === 'accept') {
        await refreshAccountGroups()
      }
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
          : action === 'accept'
            ? '招待の承諾に失敗しました'
            : '招待の拒否に失敗しました'
      alert(errorMessage)
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = invitations.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="relative flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-gray-700 hover:text-teal-700 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label="通知"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
        <span className="hidden sm:inline text-sm md:text-base font-medium">
          通知
        </span>
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-teal-50/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">招待通知</h3>
              {pendingCount > 0 && (
                <span className="bg-teal-500 text-white text-xs font-bold rounded-full px-2 py-1">
                  {pendingCount}件
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                読み込み中...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            ) : invitations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">保留中の招待はありません</p>
                <p className="text-sm mt-1">
                  新しい招待が届くとここに表示されます
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <div
                    key={invitation.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-teal-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {invitation.accountGroupName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">
                              {invitation.inviterEmail}
                            </span>
                            から招待されています
                          </p>
                        </div>
                        {invitation.expiresAt && (
                          <p className="text-xs text-gray-400 mb-3">
                            有効期限:{' '}
                            {new Date(invitation.expiresAt).toLocaleString(
                              'ja-JP'
                            )}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleRespond(invitation.id, 'accept')
                            }
                            disabled={processingId === invitation.id}
                            className={cn(
                              'flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium'
                            )}
                          >
                            {processingId === invitation.id ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                <span>処理中...</span>
                              </>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>承諾</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleRespond(invitation.id, 'reject')
                            }
                            disabled={processingId === invitation.id}
                            className={cn(
                              'px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium'
                            )}
                          >
                            <span>✕</span>
                            <span>拒否</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
