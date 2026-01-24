import { ChevronDown, LogOut, Plus, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { customInstance } from '@/api/client'
import { useAccountGroup } from '@/contexts/AccountGroupContext'
import { useAuth } from '@/contexts/AuthContext'
import type { AccountGroup } from '@/data/account-groups'

import { AccountGroupCreateModal } from '../AccountGroupCreateModal'

import { LeaveAccountGroupDialog } from './LeaveAccountGroupDialog'

export const AccountGroupSelector = () => {
  const {
    accountGroups,
    currentAccountGroupId,
    isLoading,
    refreshAccountGroups,
    setCurrentAccountGroupId,
  } = useAccountGroup()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leavingGroup, setLeavingGroup] = useState<AccountGroup | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 現在選択中のアカウントグループを取得
  const currentGroup = accountGroups.find(ag => ag.id === currentAccountGroupId)

  // 個人用グループを最初に配置
  const sortedGroups = [
    ...accountGroups.filter(ag => ag.type === 'personal'),
    ...accountGroups.filter(ag => ag.type === 'shared'),
  ]

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

  const handleSelect = (accountGroup: AccountGroup) => {
    setCurrentAccountGroupId(accountGroup.id)
    setIsOpen(false)
  }

  const handleCreateSuccess = () => {
    // AccountGroupCreateModal内で既にrefreshAccountGroupsとsetCurrentAccountGroupIdが実行される
    // ここでは何もしない
  }

  const handleLeaveClick = (
    e: React.MouseEvent,
    accountGroup: AccountGroup
  ) => {
    e.stopPropagation() // 親のonClickを防ぐ
    setLeavingGroup(accountGroup)
    setLeaveDialogOpen(true)
    setIsOpen(false) // ドロップダウンを閉じる
  }

  const handleLeaveConfirm = async () => {
    if (!leavingGroup) return

    setLeavingGroupId(leavingGroup.id)

    try {
      await customInstance.post(`/api/account-groups/${leavingGroup.id}/leave`)

      // 退会したグループが現在選択中の場合は、個人用グループに切り替え
      if (currentAccountGroupId === leavingGroup.id) {
        const personalGroup = accountGroups.find(ag => ag.type === 'personal')
        if (personalGroup) {
          setCurrentAccountGroupId(personalGroup.id)
        }
      }

      // アカウントグループ一覧を更新
      await refreshAccountGroups()
      setLeaveDialogOpen(false)
      setLeavingGroup(null)
    } catch (error) {
      console.error('Failed to leave account group:', error)
      alert(
        error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response &&
          error.response.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data &&
          typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'アカウントグループからの退会に失敗しました'
      )
    } finally {
      setLeavingGroupId(null)
    }
  }

  // 退会可能かどうかを判定
  const canLeave = (accountGroup: AccountGroup) => {
    // 個人用グループは退会不可
    if (accountGroup.type === 'personal') {
      return false
    }
    // 作成者は退会不可（削除する必要がある）
    if (accountGroup.createdBy === user?.userId) {
      return false
    }
    return true
  }

  if (isLoading || accountGroups.length === 0) {
    return (
      <div className="px-3 py-2 bg-white/20 rounded-lg">
        <span className="text-sm">
          {isLoading ? '読み込み中...' : 'グループなし'}
        </span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
        aria-label="アカウントグループを選択"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Users className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
        <span className="text-sm md:text-base font-medium truncate max-w-[150px] md:max-w-[200px]">
          {currentGroup?.name || accountGroups[0]?.name || '選択中...'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto"
          role="listbox"
        >
          {/* 新規作成ボタン */}
          <button
            onClick={() => {
              setIsOpen(false)
              setIsCreateModalOpen(true)
            }}
            type="button"
            className="w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-blue-50 transition-colors text-blue-600 font-medium"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>新しいアカウントグループを作成</span>
            </div>
          </button>

          {sortedGroups.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              アカウントグループがありません
            </div>
          ) : (
            sortedGroups.map(accountGroup => (
              <div
                key={accountGroup.id}
                className={`w-full px-4 py-3 hover:bg-gray-100 transition-colors ${
                  currentAccountGroupId === accountGroup.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSelect(accountGroup)}
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    role="option"
                    aria-selected={currentAccountGroupId === accountGroup.id}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {accountGroup.name}
                      </div>
                      {accountGroup.description && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {accountGroup.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {accountGroup.type === 'personal'
                          ? '個人用'
                          : `${accountGroup.memberCount || 0}名`}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {currentAccountGroupId === accountGroup.id && (
                      <div className="text-blue-600">✓</div>
                    )}
                    {canLeave(accountGroup) && (
                      <button
                        onClick={e => handleLeaveClick(e, accountGroup)}
                        type="button"
                        disabled={leavingGroupId === accountGroup.id}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${accountGroup.name}から退会`}
                        title={`${accountGroup.name}から退会`}
                      >
                        <LogOut
                          className={`w-4 h-4 ${
                            leavingGroupId === accountGroup.id
                              ? 'animate-spin'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* アカウントグループ作成モーダル */}
      <AccountGroupCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* 退会確認ダイアログ */}
      {leavingGroup && (
        <LeaveAccountGroupDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          onConfirm={handleLeaveConfirm}
          accountGroupName={leavingGroup.name}
          isLoading={leavingGroupId === leavingGroup.id}
        />
      )}
    </div>
  )
}
