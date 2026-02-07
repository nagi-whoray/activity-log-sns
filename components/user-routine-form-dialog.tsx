'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { UserRoutine, ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'workout', label: ACTIVITY_CATEGORY_LABELS.workout, icon: '💪' },
  { value: 'study', label: ACTIVITY_CATEGORY_LABELS.study, icon: '📚' },
  { value: 'beauty', label: ACTIVITY_CATEGORY_LABELS.beauty, icon: '✨' },
  { value: 'meal', label: ACTIVITY_CATEGORY_LABELS.meal, icon: '🍽️' },
  { value: 'work', label: ACTIVITY_CATEGORY_LABELS.work, icon: '💼' },
  { value: 'dev', label: ACTIVITY_CATEGORY_LABELS.dev, icon: '💻' },
]

interface UserRoutineFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  routine?: UserRoutine
}

export function UserRoutineFormDialog({
  open,
  onOpenChange,
  userId,
  routine,
}: UserRoutineFormDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const isEditMode = !!routine

  const [title, setTitle] = useState(routine?.title || '')
  const [category, setCategory] = useState<ActivityCategory>(routine?.category || 'workout')
  const [durationMinutes, setDurationMinutes] = useState(routine?.duration_minutes?.toString() || '')
  const [content, setContent] = useState(routine?.content || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && routine) {
      setTitle(routine.title)
      setCategory(routine.category)
      setDurationMinutes(routine.duration_minutes?.toString() || '')
      setContent(routine.content || '')
    } else if (open && !routine) {
      setTitle('')
      setCategory('workout')
      setDurationMinutes('')
      setContent('')
    }
  }, [open, routine])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)

    try {
      const durationValue = durationMinutes ? parseInt(durationMinutes, 10) : null

      if (isEditMode) {
        const { error } = await supabase
          .from('user_routines')
          .update({
            title: title.trim(),
            category,
            duration_minutes: durationValue,
            content: content.trim() || null,
          })
          .eq('id', routine.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('user_routines').insert({
          user_id: userId,
          title: title.trim(),
          category,
          duration_minutes: durationValue,
          content: content.trim() || null,
        })

        if (error) throw error
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      alert(isEditMode ? 'ルーティンの更新に失敗しました' : 'ルーティンの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'ルーティンを編集' : 'ルーティンを追加'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routine-title">タイトル *</Label>
            <Input
              id="routine-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 朝のランニング"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>カテゴリ *</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  disabled={loading}
                  className={`py-2 px-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="ml-1 text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-duration">所要時間（任意）</Label>
            <div className="flex items-center gap-2">
              <Input
                id="routine-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="例: 30"
                disabled={loading}
                min="1"
                max="1440"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">分</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine-content">内容（任意）</Label>
            <textarea
              id="routine-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ルーティンの詳細を入力..."
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              maxLength={1000}
            />
            <div className="text-right text-xs text-muted-foreground">
              {content.length}/1000
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : isEditMode ? (
                '保存する'
              ) : (
                '追加する'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
