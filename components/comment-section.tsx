'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface CommentSectionProps {
  activityLogId: string
  comments: Comment[]
  currentUserId: string | null
}

export function CommentSection({
  activityLogId,
  comments,
  currentUserId,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [localComments, setLocalComments] = useState(comments)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          activity_log_id: activityLogId,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      if (data) {
        // Supabaseの戻り値を整形
        const newComment: Comment = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          user_id: data.user_id,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
        }
        setLocalComments((prev) => [...prev, newComment])
      }

      setNewComment('')
      router.refresh()
    } catch (error) {
      console.error('Comment error:', error)
      alert('コメントの投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setLocalComments((prev) => prev.filter((c) => c.id !== commentId))
      router.refresh()
    } catch (error) {
      console.error('Delete comment error:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* コメント一覧 */}
      {localComments.length > 0 && (
        <div className="space-y-2">
          {localComments.map((comment) => {
            const displayName =
              comment.profiles?.display_name ||
              comment.profiles?.username ||
              'Unknown User'
            const isOwner = comment.user_id === currentUserId

            return (
              <div
                key={comment.id}
                className="flex gap-2 p-2 rounded-lg bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-500 hover:text-red-700 ml-auto"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* コメント入力フォーム */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !newComment.trim()}
          >
            {loading ? '...' : '送信'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          コメントするにはログインしてください
        </p>
      )}
    </div>
  )
}
