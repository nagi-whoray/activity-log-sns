'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PostForm() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('ログインが必要です')
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
      })

      if (error) throw error

      setContent('')
      router.refresh()
    } catch (error: any) {
      alert(error.message || '投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新しい投稿</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今日の活動を記録しましょう..."
            className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={loading}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {content.length}/500
            </span>
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading ? '投稿中...' : '投稿する'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
