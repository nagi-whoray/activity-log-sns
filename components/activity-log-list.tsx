'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'
import { CommentSection } from '@/components/comment-section'
import { ActivityImages } from '@/components/ActivityImages'
import { FollowButton } from '@/components/follow-button'
import { PostActionsMenu } from '@/components/post-actions-menu'
import { PostEditDialog } from '@/components/post-edit-dialog'
import { deleteMultipleImages, extractPathFromUrl } from '@/lib/supabase-storage'

interface ActivityLog {
  id: string
  category: ActivityCategory
  title: string
  content: string
  activity_date: string
  created_at: string
  updated_at: string
  user_id: string
  image_url: string | null
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  likes: { id: string; user_id: string }[]
  comments: {
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
  }[]
}

interface ActivityLogListProps {
  activityLogs: ActivityLog[]
  currentUserId: string | null
  followingIds?: string[]
  activeTab?: 'all' | 'following'
}

const CATEGORY_STYLES: Record<ActivityCategory, { bg: string; text: string; icon: string }> = {
  workout: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '💪' },
  study: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📚' },
  beauty: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '✨' },
}

function LikeButton({
  activityLogId,
  likes,
  currentUserId,
}: {
  activityLogId: string
  likes: { id: string; user_id: string }[]
  currentUserId: string | null
}) {
  const [isLiked, setIsLiked] = useState(
    likes.some((like) => like.user_id === currentUserId)
  )
  const [likesCount, setLikesCount] = useState(likes.length)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLike = async () => {
    if (!currentUserId) {
      alert('いいねするにはログインが必要です')
      return
    }

    setLoading(true)

    try {
      if (isLiked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('activity_log_id', activityLogId)
          .eq('user_id', currentUserId)

        if (error) throw error

        setIsLiked(false)
        setLikesCount((prev) => prev - 1)
      } else {
        // いいねを追加
        const { error } = await supabase.from('likes').insert({
          activity_log_id: activityLogId,
          user_id: currentUserId,
        })

        if (error) throw error

        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }

      router.refresh()
    } catch (error) {
      console.error('Like error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={`gap-1 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}`}
    >
      <span>{isLiked ? '❤️' : '🤍'}</span>
      <span>{likesCount}</span>
    </Button>
  )
}

export function ActivityLogList({ activityLogs, currentUserId, followingIds = [], activeTab }: ActivityLogListProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState<ActivityLog | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDeletePost = async (post: ActivityLog) => {
    if (!confirm('この投稿を削除しますか？\nコメントやいいねも一緒に削除されます。')) return

    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      if (post.image_url) {
        try {
          const urls = JSON.parse(post.image_url)
          if (Array.isArray(urls)) {
            const paths = urls
              .map((url: string) => extractPathFromUrl(url))
              .filter((path): path is string => path !== null)

            if (paths.length > 0) {
              await deleteMultipleImages(paths)
            }
          }
        } catch {
          // ignore parse error
        }
      }

      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  const toggleComments = (logId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  if (activityLogs.length === 0) {
    return (
      <div className="text-center py-12">
        {activeTab === 'following' ? (
          <>
            <p className="text-muted-foreground">フォロー中のユーザーの投稿がありません</p>
            <p className="text-sm text-muted-foreground mt-2">
              「全ての投稿」タブからユーザーをフォローしてみましょう！
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">まだ活動ログがありません</p>
            <p className="text-sm text-muted-foreground mt-2">
              最初の活動を記録してみましょう！
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activityLogs.map((log) => {
        const categoryStyle = CATEGORY_STYLES[log.category]
        const displayName = log.profiles?.display_name || log.profiles?.username || 'Unknown User'

        return (
          <Card key={log.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link href={`/users/${log.user_id}`} className="w-10 h-10 rounded-full overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                    {log.profiles?.avatar_url ? (
                      <Image
                        src={log.profiles.avatar_url}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {displayName[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${log.user_id}`} className="font-semibold hover:underline">{displayName}</Link>
                      <FollowButton
                        targetUserId={log.user_id}
                        currentUserId={currentUserId}
                        isFollowing={followingIds.includes(log.user_id)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        {new Date(log.activity_date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs">
                        投稿: {new Date(log.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })} {new Date(log.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        {new Date(log.updated_at) > new Date(log.created_at) && (
                          <span className="ml-1">
                            （更新: {new Date(log.updated_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })} {new Date(log.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}）
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${categoryStyle.bg} ${categoryStyle.text}`}
                  >
                    {categoryStyle.icon} {ACTIVITY_CATEGORY_LABELS[log.category]}
                  </span>
                  {log.user_id === currentUserId && (
                    <PostActionsMenu
                      onEdit={() => setEditingPost(log)}
                      onDelete={() => handleDeletePost(log)}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-wrap text-gray-700">{log.content}</p>

              {/* 画像表示 */}
              <ActivityImages imageUrl={log.image_url} />

              {/* いいね・コメントボタン */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <LikeButton
                  activityLogId={log.id}
                  likes={log.likes}
                  currentUserId={currentUserId}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleComments(log.id)}
                  className="gap-1 text-gray-500 hover:text-gray-600"
                >
                  <span>💬</span>
                  <span>{log.comments.length}</span>
                </Button>
              </div>

              {/* コメントセクション */}
              {expandedComments.has(log.id) && (
                <CommentSection
                  activityLogId={log.id}
                  comments={log.comments}
                  currentUserId={currentUserId}
                />
              )}
            </CardContent>
          </Card>
        )
      })}

      {editingPost && (
        <PostEditDialog
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          post={editingPost}
        />
      )}
    </div>
  )
}
