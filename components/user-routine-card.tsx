'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Clock, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { UserRoutineFormDialog } from '@/components/user-routine-form-dialog'
import { LinkifiedText } from '@/components/LinkifiedText'
import { OgpPreviewList } from '@/components/OgpPreviewList'
import { UserRoutine, ACTIVITY_CATEGORY_LABELS } from '@/types/database'

interface UserRoutineCardProps {
  routine: UserRoutine
  isOwnProfile: boolean
  userId: string
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  workout: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '💪' },
  study: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📚' },
  beauty: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '✨' },
  meal: { bg: 'bg-green-100', text: 'text-green-700', icon: '🍽️' },
  work: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💼' },
  dev: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '💻' },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function UserRoutineCard({ routine, isOwnProfile, userId }: UserRoutineCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const categoryStyle = CATEGORY_STYLES[routine.category] || CATEGORY_STYLES.workout
  const isActive = !routine.ended_at

  const handleStop = async () => {
    if (!confirm('このルーティンを終了しますか？\n終了後は元に戻せません。')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_routines')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', routine.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Stop error:', error)
      alert('終了に失敗しました')
    } finally {
      setLoading(false)
      setShowMenu(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このルーティンを削除しますか？')) return

    setLoading(true)
    try {
      const { error } = await supabase.from('user_routines').delete().eq('id', routine.id)

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
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{routine.title}</h4>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
              {categoryStyle.icon} {ACTIVITY_CATEGORY_LABELS[routine.category]}
            </span>
            {routine.duration_minutes && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {routine.duration_minutes}分
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {isActive ? (
              <span className="text-green-600">
                実施中（{formatDate(routine.started_at)}〜）
              </span>
            ) : (
              <span className="text-gray-500">
                {formatDate(routine.started_at)} 〜 {formatDate(routine.ended_at!)}
              </span>
            )}
          </p>

          {routine.content && (
            <div className="mt-2">
              <LinkifiedText
                text={routine.content}
                className="text-sm text-muted-foreground whitespace-pre-wrap"
              />
              <OgpPreviewList content={routine.content} />
            </div>
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
                      <Square className="w-4 h-4" /> 終了
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

      {showEditDialog && (
        <UserRoutineFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          userId={userId}
          routine={routine}
        />
      )}
    </div>
  )
}
