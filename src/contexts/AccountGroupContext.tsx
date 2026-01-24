import React, { createContext, useContext, useState, useEffect } from 'react'

import { customInstance } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import type { AccountGroup } from '@/data/account-groups'

interface AccountGroupContextType {
  currentAccountGroupId: string | null
  accountGroups: AccountGroup[]
  isLoading: boolean
  setCurrentAccountGroupId: (id: string | null) => void
  refreshAccountGroups: () => Promise<void>
}

const AccountGroupContext = createContext<AccountGroupContextType | undefined>(
  undefined
)

// eslint-disable-next-line react-refresh/only-export-components
export const useAccountGroup = () => {
  const context = useContext(AccountGroupContext)
  if (!context) {
    throw new Error('useAccountGroup must be used within AccountGroupProvider')
  }
  return context
}

interface AccountGroupProviderProps {
  children: React.ReactNode
}

export const AccountGroupProvider: React.FC<AccountGroupProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [currentAccountGroupId, setCurrentAccountGroupIdState] = useState<
    string | null
  >(null)
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ローカルストレージから現在のアカウントグループIDを読み込む
  useEffect(() => {
    const savedAccountGroupId = localStorage.getItem('currentAccountGroupId')
    if (savedAccountGroupId) {
      setCurrentAccountGroupIdState(savedAccountGroupId)
    }
  }, [])

  // アカウントグループ一覧を取得
  const refreshAccountGroups = async () => {
    // 認証されていない場合はスキップ
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // 個人用グループを先に取得（存在しない場合は作成される）
      const personalResponse = await customInstance.get<AccountGroup>(
        '/api/account-groups/personal'
      )
      const personalGroup = personalResponse.data

      // アカウントグループ一覧を取得
      const response = await customInstance.get<AccountGroup[]>(
        '/api/account-groups'
      )

      // 個人用グループがリストに含まれていない場合は追加
      const allGroups = response.data.find(ag => ag.id === personalGroup.id)
        ? response.data
        : [personalGroup, ...response.data]

      setAccountGroups(allGroups)

      // 現在のアカウントグループIDが設定されていない場合、または
      // 現在のIDがアカウントグループリストに含まれていない場合、個人用グループを設定
      setCurrentAccountGroupIdState(prev => {
        const groupIds = allGroups.map(ag => ag.id)
        const isValidId = prev && groupIds.includes(prev)

        console.log('[AccountGroupContext] Setting currentAccountGroupId:', {
          prev,
          personalGroupId: personalGroup.id,
          allGroupsCount: allGroups.length,
          groupIds,
          isValidId,
        })

        if (!prev || !isValidId) {
          console.log('[AccountGroupContext] Resetting to personal group:', {
            prev,
            isValidId,
            reason: !prev ? 'no prev' : 'invalid id',
          })
          localStorage.setItem('currentAccountGroupId', personalGroup.id)
          return personalGroup.id
        }
        console.log(
          '[AccountGroupContext] Keeping currentAccountGroupId:',
          prev
        )
        return prev
      })
    } catch (error) {
      console.error('Failed to fetch account groups:', error)
      // エラー時も空配列を設定してローディングを解除
      setAccountGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  // 認証が完了してからアカウントグループ一覧を取得
  useEffect(() => {
    // 認証が完了していない、または認証中はスキップ
    if (authLoading || !isAuthenticated) {
      setIsLoading(authLoading)
      return
    }

    refreshAccountGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading])

  // 現在のアカウントグループIDを設定（ローカルストレージにも保存）
  const setCurrentAccountGroupId = (id: string | null) => {
    console.log('[AccountGroupContext] setCurrentAccountGroupId called:', id)
    setCurrentAccountGroupIdState(id)
    if (id) {
      localStorage.setItem('currentAccountGroupId', id)
    } else {
      localStorage.removeItem('currentAccountGroupId')
    }
  }

  // デバッグログ
  useEffect(() => {
    console.log('[AccountGroupContext] State updated:', {
      currentAccountGroupId,
      accountGroupsCount: accountGroups.length,
      isLoading,
      isAuthenticated,
    })
  }, [currentAccountGroupId, accountGroups.length, isLoading, isAuthenticated])

  const value: AccountGroupContextType = {
    currentAccountGroupId,
    accountGroups,
    isLoading,
    setCurrentAccountGroupId,
    refreshAccountGroups,
  }

  return (
    <AccountGroupContext.Provider value={value}>
      {children}
    </AccountGroupContext.Provider>
  )
}
