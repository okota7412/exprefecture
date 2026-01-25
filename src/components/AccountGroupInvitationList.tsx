import { Check, X, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import type { AccountGroupInvitation } from '@/data/account-groups'
import { cn } from '@/lib/utils'

type AccountGroupInvitationListProps = {
  onInvitationAccepted?: () => void
}

export const AccountGroupInvitationList = ({
  onInvitationAccepted,
}: AccountGroupInvitationListProps) => {
  const { refreshAccountGroups } = useAccountGroup()
  const [invitations, setInvitations] = useState<AccountGroupInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchInvitations()
  }, [])

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
        onInvitationAccepted?.()
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

  if (isLoading) {
    return <div className="px-4 py-3 text-sm text-gray-500">読み込み中...</div>
  }

  if (error) {
    return (
      <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-md">
        {error}
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500">
        保留中の招待はありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invitations.map(invitation => (
        <div
          key={invitation.id}
          className="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {invitation.accountGroupName}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {invitation.inviterEmail} から招待されています
              </p>
              {invitation.expiresAt && (
                <p className="text-xs text-gray-400 mt-1">
                  有効期限:{' '}
                  {new Date(invitation.expiresAt).toLocaleString('ja-JP')}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleRespond(invitation.id, 'accept')}
                disabled={processingId === invitation.id}
                className={cn(
                  'px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm'
                )}
              >
                <Check className="w-4 h-4" />
                <span>承諾</span>
              </button>
              <button
                onClick={() => handleRespond(invitation.id, 'reject')}
                disabled={processingId === invitation.id}
                className={cn(
                  'px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-sm'
                )}
              >
                <X className="w-4 h-4" />
                <span>拒否</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
