import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { customInstance } from '@/api/client'
import type { Group } from '@/data/groups'

import { GroupCreateModal } from './GroupCreateModal'
import { GroupEditModal } from './GroupEditModal'
import { DeleteConfirmDialog } from './shared/DeleteConfirmDialog'
import { Header } from './shared/Header'
import { HeroSection } from './shared/HeroSection'
import { SearchBar } from './shared/SearchBar'
import { SelectionGrid } from './shared/SelectionGrid'

export const GroupHome = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchGroups = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await customInstance.get<Group[]>('/api/groups')
      setGroups(response.data)
    } catch (err) {
      console.error('Failed to fetch groups:', err)
      setError('グループの取得に失敗しました')
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleGroupClick = (groupId: string | number) => {
    navigate(`/groups/${groupId}`)
  }

  const handleEditClick = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation()
    setEditingGroup(group)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation()
    setDeletingGroupId(groupId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingGroupId) return

    setIsDeleting(true)
    setError(null)

    try {
      await customInstance.delete(`/api/groups/${deletingGroupId}`)
      await fetchGroups()
      setDeleteDialogOpen(false)
      setDeletingGroupId(null)
    } catch (err) {
      console.error('Failed to delete group:', err)
      let errorMessage = 'グループの削除に失敗しました'
      if (
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
      ) {
        errorMessage = err.response.data.message
      }
      setError(errorMessage)
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateSuccess = async () => {
    await fetchGroups()
  }

  const handleEditSuccess = async () => {
    await fetchGroups()
    setIsEditModalOpen(false)
    setEditingGroup(null)
  }

  // 検索フィルタリング
  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const groupItems = filteredGroups.map(group => ({
    id: group.id,
    title: group.name,
    subtitle: group.description || undefined,
    itemCount: group.itemCount || 0,
    actions: (
      <div className="flex gap-2">
        <button
          onClick={e => handleEditClick(e, group)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          aria-label="グループを編集"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={e => handleDeleteClick(e, group.id)}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          aria-label="グループを削除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }))

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <HeroSection
          title="グループ一覧"
          description={
            isLoading
              ? '読み込み中...'
              : groups.length > 0
                ? `${groups.length}個のグループ`
                : 'グループがありません'
          }
        />
        <div className="flex gap-2.5 mb-4 md:mb-5">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            aria-label="新しいグループを作成"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
            <span className="text-sm md:text-base font-medium">新規作成</span>
          </button>
        </div>
        <SearchBar
          onSearchChange={setSearchQuery}
          placeholder="グループ名で検索"
        />
        <section aria-label="グループ一覧" className="pb-4 md:pb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm md:text-base">
                読み込み中...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2 text-sm md:text-base">{error}</p>
              <button
                type="button"
                onClick={fetchGroups}
                className="text-blue-600 hover:text-blue-700 text-sm md:text-base"
              >
                再読み込み
              </button>
            </div>
          ) : groupItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm md:text-base mb-4">
                {searchQuery
                  ? '検索条件に一致するグループが見つかりませんでした'
                  : 'グループがありません。新しいグループを作成してください。'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm md:text-base font-medium"
                >
                  グループを作成
                </button>
              )}
            </div>
          ) : (
            <SelectionGrid items={groupItems} onItemClick={handleGroupClick} />
          )}
        </section>
      </main>
      <GroupCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
      {editingGroup && (
        <GroupEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          group={editingGroup}
          onSuccess={handleEditSuccess}
        />
      )}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="グループを削除しますか？"
        message="このグループに紐づくアイテムとの関連は削除されますが、アイテム自体は削除されません。この操作は取り消せません。"
        itemCount={1}
        isLoading={isDeleting}
      />
    </div>
  )
}
