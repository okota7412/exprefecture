import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'

import { customInstance } from '@/api/client'
import { cn } from '@/lib/utils'

type GroupCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const GroupCreateModal = ({
  onOpenChange,
  onSuccess,
  open,
}: GroupCreateModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('グループ名を入力してください')
      return
    }

    setIsLoading(true)

    try {
      await customInstance.post('/api/groups', {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      // 成功時はフォームをリセットしてモーダルを閉じる
      setName('')
      setDescription('')
      onOpenChange(false)
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
          : 'グループの作成に失敗しました。もう一度お試しください。'
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
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
            新しいグループを作成
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="group-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                グループ名 <span className="text-red-500">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 関西旅行"
              />
            </div>

            <div>
              <label
                htmlFor="group-description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                説明
              </label>
              <textarea
                id="group-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="グループの説明を入力してください（任意）"
              />
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
                  'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
