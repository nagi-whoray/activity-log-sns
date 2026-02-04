'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'workout', label: ACTIVITY_CATEGORY_LABELS.workout, icon: '💪' },
  { value: 'study', label: ACTIVITY_CATEGORY_LABELS.study, icon: '📚' },
  { value: 'beauty', label: ACTIVITY_CATEGORY_LABELS.beauty, icon: '✨' },
]

export function ActivityLogForm() {
  const [category, setCategory] = useState<ActivityCategory>('workout')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('ログインが必要です')
      }

      // プロフィールが存在するか確認し、なければ自動作成
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'user',
        })
        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('プロフィールの作成に失敗しました')
        }
      }

      const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        category,
        title: title.trim(),
        content: content.trim(),
        activity_date: activityDate,
      })

      if (error) throw error

      setTitle('')
      setContent('')
      setActivityDate(new Date().toISOString().split('T')[0])
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '投稿に失敗しました'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>活動を記録する</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="ml-1 text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 朝のランニング30分"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* 活動日 */}
          <div className="space-y-2">
            <Label htmlFor="activityDate">活動日</Label>
            <Input
              id="activityDate"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日の活動の詳細を記録しましょう..."
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={loading}
              maxLength={1000}
            />
            <div className="text-right text-sm text-muted-foreground">
              {content.length}/1000
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? '投稿中...' : '投稿する'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
