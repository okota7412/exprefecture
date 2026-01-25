import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import { cn } from '@/lib/utils'

type AccountGroupCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const AccountGroupCreateModal = ({
  onOpenChange,
  onSuccess,
  open,
}: AccountGroupCreateModalProps) => {
  const { refreshAccountGroups, setCurrentAccountGroupId } = useAccountGroup()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [invitations, setInvitations] = useState<string[]>([])
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingInvitation, setIsAddingInvitation] = useState(false)

  const handleAddInvitation = async () => {
    if (!inviteeEmail.trim()) {
      setInvitationError('メールアドレスを入力してください')
      return
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteeEmail.trim())) {
      setInvitationError('有効なメールアドレスを入力してください')
      return
    }

    // 既に追加されているかチェック
    if (invitations.includes(inviteeEmail.trim().toLowerCase())) {
      setInvitationError('このメールアドレスは既に追加されています')
      return
    }

    setIsAddingInvitation(true)
    setInvitationError(null)

    try {
      // ユーザーが存在するか確認（招待APIを呼び出して確認）
      // 実際のユーザー検証はバックエンドで行われるため、ここでは形式チェックのみ
      setInvitations([...invitations, inviteeEmail.trim().toLowerCase()])
      setInviteeEmail('')
      setInvitationError(null)
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
          : '招待の追加に失敗しました'
      setInvitationError(errorMessage)
    } finally {
      setIsAddingInvitation(false)
    }
  }

  const handleRemoveInvitation = (email: string) => {
    setInvitations(invitations.filter(inv => inv !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInvitationError(null)

    if (!name.trim()) {
      setError('アカウントグループ名を入力してください')
      return
    }

    setIsLoading(true)

    try {
      // アカウントグループを作成
      const response = await customInstance.post<{
        id: string
        name: string
        description?: string
        type: 'personal' | 'shared'
        createdBy: string
        memberCount?: number
        createdAt: string
        updatedAt: string
      }>('/api/account-groups', {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      const accountGroupId = response.data.id

      // 招待を送信
      const invitationErrors: string[] = []
      for (const email of invitations) {
        try {
          await customInstance.post(
            `/api/account-groups/${accountGroupId}/invitations`,
            {
              inviteeEmail: email,
            }
          )
        } catch (invErr) {
          const errorMessage =
            invErr &&
            typeof invErr === 'object' &&
            'response' in invErr &&
            invErr.response &&
            typeof invErr.response === 'object' &&
            'data' in invErr.response &&
            invErr.response.data &&
            typeof invErr.response.data === 'object' &&
            'message' in invErr.response.data &&
            typeof invErr.response.data.message === 'string'
              ? invErr.response.data.message
              : `${email}への招待に失敗しました`
          invitationErrors.push(errorMessage)
        }
      }

      // 成功時はフォームをリセットしてモーダルを閉じる
      setName('')
      setDescription('')
      setInviteeEmail('')
      setInvitations([])
      onOpenChange(false)

      // アカウントグループ一覧を更新
      await refreshAccountGroups()

      // 作成したアカウントグループを選択
      setCurrentAccountGroupId(accountGroupId)

      // 招待エラーがある場合は警告を表示
      if (invitationErrors.length > 0) {
        alert(
          `アカウントグループは作成されましたが、一部の招待に失敗しました:\n${invitationErrors.join('\n')}`
        )
      }

      onSuccess()
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
          : 'アカウントグループの作成に失敗しました。もう一度お試しください。'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      // モーダルを閉じる際にフォームをリセット
      setName('')
      setDescription('')
      setInviteeEmail('')
      setInvitations([])
      setError(null)
      setInvitationError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
            新しいアカウントグループを作成
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="account-group-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                アカウントグループ名 <span className="text-red-500">*</span>
              </label>
              <input
                id="account-group-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="例: 家族旅行"
              />
            </div>

            <div>
              <label
                htmlFor="account-group-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                説明
              </label>
              <textarea
                id="account-group-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="アカウントグループの説明を入力してください（任意）"
              />
            </div>

            {/* 招待セクション */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メンバーを招待（任意）
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteeEmail}
                    onChange={e => {
                      setInviteeEmail(e.target.value)
                      setInvitationError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddInvitation()
                      }
                    }}
                    placeholder="メールアドレスを入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={isLoading || isAddingInvitation}
                  />
                  <button
                    type="button"
                    onClick={handleAddInvitation}
                    disabled={
                      isLoading || isAddingInvitation || !inviteeEmail.trim()
                    }
                    className={cn(
                      'px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                </div>

                {invitationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    {invitationError}
                  </div>
                )}

                {invitations.length > 0 && (
                  <div className="space-y-1">
                    {invitations.map(email => (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                      >
                        <span className="text-sm text-gray-700">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvitation(email)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 disabled:opacity-50"
                          aria-label={`${email}を削除`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                招待されたユーザーは存在しない場合、エラーになります
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-md text-sm">
              <p className="font-medium mb-1">アカウントグループについて</p>
              <p>
                アカウントグループを作成すると、メンバーを招待して一緒に旅行計画を共有できます。
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                )}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className={cn(
                  'px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                )}
              >
                {isLoading ? '作成中...' : '作成'}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
