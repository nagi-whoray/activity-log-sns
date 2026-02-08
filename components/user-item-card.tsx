'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, MoreHorizontal, Pencil, Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { UserItemFormDialog } from '@/components/user-item-form-dialog'
import { OgpPreviewCard } from '@/components/OgpPreviewCard'
import { UserItem } from '@/types/database'

interface UserItemCardProps {
  item: UserItem
  isOwnProfile: boolean
  userId: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function UserItemCard({ item, isOwnProfile, userId }: UserItemCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isActive = !item.ended_at

  const handleStop = async () => {
    if (!confirm('このアイテムの利用を停止しますか？\n停止後は元に戻せません。')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_items')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', item.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Stop error:', error)
      alert('利用停止に失敗しました')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このアイテムを削除しますか？')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('user_items').delete().eq('id', item.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除に失敗しました')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${isActive ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{item.product_name}</h4>
            {item.product_url && (
              <a
                href={item.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {isActive ? (
              <span className="text-green-600">
                利用中（{formatDate(item.started_at)}〜）
              </span>
            ) : (
              <span className="text-gray-500">
                {formatDate(item.started_at)} 〜 {formatDate(item.ended_at!)}
              </span>
            )}
          </p>

          {item.usage_method && (
            <p className="text-sm text-muted-foreground mt-1">{item.usage_method}</p>
          )}
        </div>

        {isOwnProfile && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              disabled={loading}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg border shadow-lg z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowEditDialog(true)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> 編集
                  </button>
                  {isActive && (
                    <button
                      onClick={handleStop}
                      disabled={loading}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-orange-600"
                    >
                      <Square className="w-4 h-4" /> 利用停止
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" /> 削除
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {item.product_url && (
        <div className="mt-3">
          <OgpPreviewCard url={item.product_url} />
        </div>
      )}

      {showEditDialog && (
        <UserItemFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          userId={userId}
          item={item}
        />
      )}
    </div>
  )
}
