import * as Dialog from '@radix-ui/react-dialog'
import { LogOut, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import { useAuth } from '@/contexts/AuthContext'
import type { AccountGroup, AccountGroupMember } from '@/data/account-groups'
import { cn } from '@/lib/utils'

import { LeaveAccountGroupDialog } from './shared/LeaveAccountGroupDialog'

type AccountGroupEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountGroup: AccountGroup | null
  onSuccess: () => void
}

const roleLabel: Record<string, string> = {
  owner: 'オーナー',
  admin: '管理者',
  member: 'メンバー',
}

export const AccountGroupEditModal = ({
  accountGroup,
  onOpenChange,
  onSuccess,
  open,
}: AccountGroupEditModalProps) => {
  const { user } = useAuth()
  const {
    accountGroups,
    currentAccountGroupId,
    refreshAccountGroups,
    setCurrentAccountGroupId,
  } = useAccountGroup()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<AccountGroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const canEdit =
    !!user?.userId &&
    (accountGroup?.type === 'personal' ||
      accountGroup?.createdBy === user.userId)
  const canLeave =
    !!accountGroup &&
    accountGroup.type === 'shared' &&
    accountGroup.createdBy !== user?.userId
  const canInvite = !!accountGroup && accountGroup.type === 'shared'

  const fetchMembers = useCallback(async () => {
    if (!accountGroup?.id || !open) return
    setMembersLoading(true)
    try {
      const res = await customInstance.get<AccountGroupMember[]>(
        `/api/account-groups/${accountGroup.id}/members`
      )
      setMembers(res.data)
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }, [accountGroup?.id, open])

  useEffect(() => {
    if (accountGroup && open) {
      setName(accountGroup.name)
      setDescription(accountGroup.description || '')
      setError(null)
      setInvitationError(null)
      setInviteeEmail('')
      fetchMembers()
    }
  }, [accountGroup, open, fetchMembers])

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!accountGroup || !canEdit) return
    if (!name.trim()) {
      setError('アカウントグループ名を入力してください')
      return
    }
    setIsLoading(true)
    try {
      await customInstance.patch(`/api/account-groups/${accountGroup.id}`, {
        name: name.trim(),
        description: description.trim() || null,
      })
      await refreshAccountGroups()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        (err.response as { data?: { message?: string } }).data &&
        typeof (err.response as { data: { message?: string } }).data.message ===
          'string'
          ? (err.response as { data: { message: string } }).data.message
          : 'アカウントグループの更新に失敗しました。もう一度お試しください。'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!accountGroup?.id || !inviteeEmail.trim()) {
      setInvitationError('メールアドレスを入力してください')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteeEmail.trim())) {
      setInvitationError('有効なメールアドレスを入力してください')
      return
    }
    setIsInviting(true)
    setInvitationError(null)
    try {
      await customInstance.post(
        `/api/account-groups/${accountGroup.id}/invitations`,
        { inviteeEmail: inviteeEmail.trim().toLowerCase() }
      )
      setInviteeEmail('')
      await fetchMembers()
      await refreshAccountGroups()
    } catch (err) {
      const msg =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        (err.response as { data?: { message?: string } }).data &&
        typeof (err.response as { data: { message?: string } }).data.message ===
          'string'
          ? (err.response as { data: { message: string } }).data.message
          : '招待の送信に失敗しました'
      setInvitationError(msg)
    } finally {
      setIsInviting(false)
    }
  }

  const handleLeaveConfirm = async () => {
    if (!accountGroup) return
    setIsLeaving(true)
    try {
      await customInstance.post(`/api/account-groups/${accountGroup.id}/leave`)
      if (currentAccountGroupId === accountGroup.id) {
        const personal = accountGroups.find(ag => ag.type === 'personal')
        if (personal) setCurrentAccountGroupId(personal.id)
      }
      await refreshAccountGroups()
      setLeaveDialogOpen(false)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to leave account group:', err)
      alert(
        err &&
          typeof err === 'object' &&
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'data' in err.response &&
          (err.response as { data?: { message?: string } }).data &&
          typeof (err.response as { data: { message?: string } }).data
            .message === 'string'
          ? (err.response as { data: { message: string } }).data.message
          : 'アカウントグループからの退会に失敗しました'
      )
    } finally {
      setIsLeaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading && !isLeaving && accountGroup) {
      setName(accountGroup.name)
      setDescription(accountGroup.description || '')
      setError(null)
      setInvitationError(null)
      setInviteeEmail('')
      setLeaveDialogOpen(false)
    }
    onOpenChange(newOpen)
  }

  if (!accountGroup) return null

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
              アカウントグループの設定
            </Dialog.Title>

            <div className="space-y-6">
              {/* 基本情報 */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  基本情報
                </h3>
                {canEdit ? (
                  <form
                    onSubmit={handleUpdateSubmit}
                    className="space-y-4"
                    id="edit-account-group-form"
                  >
                    <div>
                      <label
                        htmlFor="edit-account-group-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        アカウントグループ名{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="edit-account-group-name"
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
                        htmlFor="edit-account-group-description"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        説明
                      </label>
                      <textarea
                        id="edit-account-group-description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                        placeholder="説明（任意）"
                      />
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        form="edit-account-group-form"
                        disabled={isLoading || !name.trim()}
                        className={cn(
                          'px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        )}
                      >
                        {isLoading ? '更新中...' : '更新'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3">
                    <div>
                      <span className="text-xs text-gray-500">名前</span>
                      <p className="font-medium text-gray-900">
                        {accountGroup.name}
                      </p>
                    </div>
                    {accountGroup.description && (
                      <div>
                        <span className="text-xs text-gray-500">説明</span>
                        <p className="text-gray-700">
                          {accountGroup.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 所属者一覧 */}
              <section className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  メンバー（{members.length}名）
                </h3>
                {membersLoading ? (
                  <div className="text-sm text-gray-500 py-4">
                    読み込み中...
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4">
                    メンバーがいません
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {members.map(m => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50/50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {m.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {roleLabel[m.role] ?? m.role} ·{' '}
                            {new Date(m.joinedAt).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* 招待（共有グループのみ） */}
              {canInvite && (
                <section className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    メンバーを招待
                  </h3>
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
                            handleInvite()
                          }
                        }}
                        placeholder="メールアドレスを入力"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        disabled={isInviting}
                      />
                      <button
                        type="button"
                        onClick={handleInvite}
                        disabled={isInviting || !inviteeEmail.trim()}
                        className={cn(
                          'px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        招待
                      </button>
                    </div>
                    {invitationError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                        {invitationError}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      招待されたユーザーは存在しない場合、エラーになります
                    </p>
                  </div>
                </section>
              )}

              {/* 退会（共有かつ作成者以外） */}
              {canLeave && (
                <section className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    退会
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    このアカウントグループから退会すると、データへのアクセスができなくなります。
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeaveDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    このグループから退会する
                  </button>
                </section>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || isLeaving}
                className={cn(
                  'px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                )}
              >
                閉じる
              </button>
            </div>

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

      <LeaveAccountGroupDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirm={handleLeaveConfirm}
        accountGroupName={accountGroup.name}
        isLoading={isLeaving}
      />
    </>
  )
}
