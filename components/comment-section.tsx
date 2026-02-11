'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LinkifiedText } from '@/components/LinkifiedText'
import { OgpPreviewList } from '@/components/OgpPreviewList'

interface CommentLike {
  id: string
  user_id: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  comment_likes: CommentLike[]
}

interface CommentSectionProps {
  activityLogId: string
  postOwnerId: string
  comments: Comment[]
  currentUserId: string | null
}

export function CommentSection({
  activityLogId,
  postOwnerId,
  comments,
  currentUserId,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [localComments, setLocalComments] = useState(comments)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // 親コメント（parent_id が null）を created_at 昇順で取得
  const parentComments = localComments
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // 指定した親コメントの返信を取得
  const getReplies = (parentId: string) =>
    localComments
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setLoading(true)

    // 返信への返信は親に帰属（1階層のみ）
    const parentId = replyingTo?.parent_id || replyingTo?.id || null

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          activity_log_id: activityLogId,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: parentId,
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          parent_id,
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
        const newCommentData: Comment = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          user_id: data.user_id,
          parent_id: data.parent_id,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          comment_likes: [],
        }
        setLocalComments((prev) => [...prev, newCommentData])

        if (parentId) {
          // 返信 → 親コメント主に comment_reply 通知
          const parentComment = localComments.find((c) => c.id === parentId)
          const parentCommentAuthorId = parentComment?.user_id
          if (parentCommentAuthorId && parentCommentAuthorId !== currentUserId) {
            try {
              await supabase.from('notifications').insert({
                user_id: parentCommentAuthorId,
                actor_id: currentUserId,
                type: 'comment_reply',
                activity_log_id: activityLogId,
                comment_id: data.id,
              })
            } catch {
              // 通知作成失敗は無視
            }
          }
        } else {
          // 通常コメント → 投稿主に comment 通知
          if (postOwnerId !== currentUserId) {
            try {
              await supabase.from('notifications').insert({
                user_id: postOwnerId,
                actor_id: currentUserId,
                type: 'comment',
                activity_log_id: activityLogId,
                comment_id: data.id,
              })
            } catch {
              // 通知作成失敗は無視
            }
          }
        }
      }

      setNewComment('')
      setReplyingTo(null)
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

      // 通知も削除（comment + comment_reply）
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('comment_id', commentId)
          .in('type', ['comment', 'comment_reply'])
      } catch {
        // 通知削除失敗は無視
      }

      // 親コメント削除時は子返信もローカルから削除（DBはCASCADE）
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId))
      router.refresh()
    } catch (error) {
      console.error('Delete comment error:', error)
      alert('コメントの削除に失敗しました')
    }
  }

  const handleToggleCommentLike = async (commentId: string, commentOwnerId: string) => {
    if (!currentUserId) return

    const comment = localComments.find(c => c.id === commentId)
    if (!comment) return

    const isLiked = comment.comment_likes.some(cl => cl.user_id === currentUserId)

    // 楽観的更新
    setLocalComments(prev => prev.map(c => {
      if (c.id !== commentId) return c
      if (isLiked) {
        return { ...c, comment_likes: c.comment_likes.filter(cl => cl.user_id !== currentUserId) }
      } else {
        return { ...c, comment_likes: [...c.comment_likes, { id: 'temp', user_id: currentUserId }] }
      }
    }))

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId)
        if (error) throw error

        // 通知削除
        try {
          await supabase
            .from('notifications')
            .delete()
            .eq('actor_id', currentUserId)
            .eq('comment_id', commentId)
            .eq('type', 'comment_like')
        } catch { /* 無視 */ }
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUserId })
        if (error) throw error

        // 自分のコメント以外には通知作成
        if (commentOwnerId !== currentUserId) {
          try {
            await supabase.from('notifications').insert({
              user_id: commentOwnerId,
              actor_id: currentUserId,
              type: 'comment_like',
              activity_log_id: activityLogId,
              comment_id: commentId,
            })
          } catch { /* 無視 */ }
        }
      }
    } catch {
      // ロールバック
      setLocalComments(prev => prev.map(c => {
        if (c.id !== commentId) return c
        if (isLiked) {
          return { ...c, comment_likes: [...c.comment_likes, { id: 'temp', user_id: currentUserId }] }
        } else {
          return { ...c, comment_likes: c.comment_likes.filter(cl => cl.user_id !== currentUserId) }
        }
      }))
    }
  }

  const renderComment = (comment: Comment, isReply: boolean, parentComment?: Comment) => {
    const displayName =
      comment.profiles?.display_name ||
      comment.profiles?.username ||
      'Unknown User'
    const isOwner = comment.user_id === currentUserId
    const isLiked = currentUserId ? comment.comment_likes.some(cl => cl.user_id === currentUserId) : false
    const likeCount = comment.comment_likes.length

    return (
      <div
        key={comment.id}
        className={`flex gap-2 p-2 rounded-lg ${isReply ? 'bg-gray-50/70' : 'bg-gray-50'}`}
      >
        <div className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full overflow-hidden flex-shrink-0`}>
          {comment.profiles?.avatar_url ? (
            <Image
              src={comment.profiles.avatar_url}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* 返信先表示 */}
          {isReply && parentComment && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              <span>↩</span>
              <span>{parentComment.profiles?.display_name || parentComment.profiles?.username}への返信</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>{displayName}</span>
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
          <p className={`${isReply ? 'text-xs' : 'text-sm'} text-gray-700 whitespace-pre-wrap`}>
            <LinkifiedText text={comment.content} />
          </p>
          <OgpPreviewList content={comment.content} maxPreviews={1} />
          {/* いいね & 返信ボタン */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleCommentLike(comment.id, comment.user_id)}
                className={`text-xs transition-colors ${
                  isLiked
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={!currentUserId}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              {likeCount > 0 && (
                <span className={`text-xs ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
                  {likeCount}
                </span>
              )}
            </div>
            {currentUserId && (
              <button
                onClick={() => setReplyingTo(comment)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                返信
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* コメント一覧 */}
      {localComments.length > 0 && (
        <div className="space-y-2">
          {parentComments.map((comment) => {
            const replies = getReplies(comment.id)
            return (
              <div key={comment.id} className="space-y-1">
                {renderComment(comment, false)}
                {/* 返信 */}
                {replies.length > 0 && (
                  <div className="ml-10 space-y-1 border-l-2 border-gray-200 pl-3">
                    {replies.map((reply) => renderComment(reply, true, comment))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* コメント入力フォーム */}
      {currentUserId ? (
        <div>
          {replyingTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-t-lg text-sm text-blue-700">
              <span>
                @{replyingTo.profiles?.display_name || replyingTo.profiles?.username}への返信
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-auto text-blue-400 hover:text-blue-600"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? '返信を入力...' : 'コメントを入力...'}
              className={`flex-1 px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                replyingTo ? 'rounded-bl-lg rounded-br-lg' : 'rounded-lg'
              }`}
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
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          コメントするにはログインしてください
        </p>
      )}
    </div>
  )
}
