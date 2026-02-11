'use client'

import { memo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS, LogType } from '@/types/database'
import { CommentSection } from '@/components/comment-section'
import { ActivityImages } from '@/components/ActivityImages'
import { LinkifiedText } from '@/components/LinkifiedText'
import { OgpPreviewList } from '@/components/OgpPreviewList'
import { FollowButton } from '@/components/follow-button'
import { PostActionsMenu } from '@/components/post-actions-menu'
import { PostEditDialog } from '@/components/post-edit-dialog'
import { deleteMultipleImages, extractPathFromUrl } from '@/lib/supabase-storage'

export interface ActivityLogData {
  id: string
  category: ActivityCategory
  title: string
  content: string
  activity_date: string
  activity_duration_minutes: number | null
  created_at: string
  updated_at: string
  user_id: string
  image_url: string | null
  is_image_private: boolean
  log_type: LogType
  routine_id: string | null
  routine: {
    id: string
    title: string
  } | null
  profiles: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  likes: {
    id: string
    user_id: string
    profiles: {
      id: string
      username: string
      display_name: string | null
      avatar_url: string | null
    } | null
  }[]
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
    comment_likes: {
      id: string
      user_id: string
    }[]
  }[]
}

interface ActivityLogCardProps {
  log: ActivityLogData
  currentUserId: string | null
  isFollowing: boolean
  onLikeUpdate?: (logId: string, isLiked: boolean) => void
  onDelete?: (logId: string) => void
  defaultExpandComments?: boolean
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) {
    return `${hours}時間${mins}分`
  } else if (hours > 0) {
    return `${hours}時間`
  } else {
    return `${mins}分`
  }
}

const CATEGORY_STYLES: Record<ActivityCategory, { bg: string; text: string; icon: string }> = {
  workout: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '💪' },
  study: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📚' },
  beauty: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '✨' },
  meal: { bg: 'bg-green-100', text: 'text-green-700', icon: '🍽️' },
  work: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💼' },
  dev: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '💻' },
}

function LikeButton({
  activityLogId,
  postOwnerId,
  likes,
  currentUserId,
  onLikeUpdate,
}: {
  activityLogId: string
  postOwnerId: string
  likes: ActivityLogData['likes']
  currentUserId: string | null
  onLikeUpdate?: (logId: string, isLiked: boolean) => void
}) {
  const [isLiked, setIsLiked] = useState(
    likes.some((like) => like.user_id === currentUserId)
  )
  const [likesCount, setLikesCount] = useState(likes.length)
  const [loading, setLoading] = useState(false)
  const [showLikesDialog, setShowLikesDialog] = useState(false)
  const supabase = createClient()

  const handleLike = async () => {
    if (!currentUserId) {
      alert('いいねするにはログインが必要です')
      return
    }

    setLoading(true)

    // 楽観的更新
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount((prev) => newIsLiked ? prev + 1 : prev - 1)

    try {
      if (!newIsLiked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('activity_log_id', activityLogId)
          .eq('user_id', currentUserId)

        if (error) throw error

        // 通知も削除
        try {
          await supabase
            .from('notifications')
            .delete()
            .eq('actor_id', currentUserId)
            .eq('activity_log_id', activityLogId)
            .eq('type', 'like')
        } catch {
          // 通知削除失敗は無視
        }
      } else {
        // いいねを追加
        const { error } = await supabase.from('likes').insert({
          activity_log_id: activityLogId,
          user_id: currentUserId,
        })

        if (error) throw error

        // 自分の投稿以外には通知を作成
        if (postOwnerId !== currentUserId) {
          try {
            await supabase.from('notifications').insert({
              user_id: postOwnerId,
              actor_id: currentUserId,
              type: 'like',
              activity_log_id: activityLogId,
            })
          } catch {
            // 通知作成失敗は無視
          }
        }
      }

      onLikeUpdate?.(activityLogId, newIsLiked)
    } catch (error) {
      // エラー時はロールバック
      setIsLiked(isLiked)
      setLikesCount((prev) => isLiked ? prev : prev - 1)
      console.error('Like error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`inline-flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={loading}
          className={`px-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
        </Button>
        {likesCount > 0 ? (
          <button
            onClick={() => setShowLikesDialog(true)}
            className="text-sm hover:underline cursor-pointer"
          >
            {likesCount}
          </button>
        ) : (
          <span className="text-sm">{likesCount}</span>
        )}
      </div>

      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>いいねしたユーザー</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {likes.map((like) => {
              const displayName = like.profiles?.display_name || like.profiles?.username || 'Unknown User'
              return (
                <Link
                  key={like.id}
                  href={`/users/${like.user_id}`}
                  onClick={() => setShowLikesDialog(false)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {like.profiles?.avatar_url ? (
                      <Image
                        src={like.profiles.avatar_url}
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
                  </div>
                  <span className="font-medium">{displayName}</span>
                </Link>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ActivityLogCardInner({
  log,
  currentUserId,
  isFollowing,
  onLikeUpdate,
  onDelete,
  defaultExpandComments = false,
}: ActivityLogCardProps) {
  const [expandedComments, setExpandedComments] = useState(defaultExpandComments)
  const [editingPost, setEditingPost] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeletePost = async () => {
    if (!confirm('この投稿を削除しますか？\nコメントやいいねも一緒に削除されます。')) return

    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', log.id)

      if (error) throw error

      if (log.image_url) {
        try {
          const urls = JSON.parse(log.image_url)
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

      onDelete?.(log.id)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  const categoryStyle = CATEGORY_STYLES[log.category]
  const displayName = log.profiles?.display_name || log.profiles?.username || 'Unknown User'
  const isAchievement = log.log_type === 'achievement'

  return (
    <>
      <Card className={isAchievement ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/users/${log.user_id}`} className="font-semibold hover:underline truncate">{displayName}</Link>
                  <FollowButton
                    targetUserId={log.user_id}
                    currentUserId={currentUserId}
                    isFollowing={isFollowing}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {isAchievement && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-100 text-amber-700 border border-amber-200">
                      🏆 達成
                    </span>
                  )}
                  {log.routine && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-indigo-100 text-indigo-700 border border-indigo-200">
                      🔄 {log.routine.title}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${categoryStyle.bg} ${categoryStyle.text}`}
                  >
                    {categoryStyle.icon} {ACTIVITY_CATEGORY_LABELS[log.category]}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    {new Date(log.activity_date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {log.activity_duration_minutes && (
                      <span className="ml-2">⏱️ {formatDuration(log.activity_duration_minutes)}</span>
                    )}
                  </p>
                  <p className="text-xs">
                    投稿 {new Date(log.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')} {new Date(log.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {(new Date(log.updated_at).getTime() - new Date(log.created_at).getTime()) > 60000 && (
                    <p className="text-xs">
                      更新 {new Date(log.updated_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')} {new Date(log.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {log.user_id === currentUserId && (
              <div className="shrink-0">
                <PostActionsMenu
                  onEdit={() => setEditingPost(true)}
                  onDelete={handleDeletePost}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-gray-700">
            <LinkifiedText text={log.content} />
          </p>
          <OgpPreviewList content={log.content} maxPreviews={3} />

          <ActivityImages
            imageUrl={log.image_url}
            isImagePrivate={log.is_image_private ?? false}
            isOwner={log.user_id === currentUserId}
          />

          <div className="flex items-center gap-2 pt-2 border-t">
            <LikeButton
              activityLogId={log.id}
              postOwnerId={log.user_id}
              likes={log.likes}
              currentUserId={currentUserId}
              onLikeUpdate={onLikeUpdate}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedComments(!expandedComments)}
              className="gap-1 text-gray-500 hover:text-gray-600"
            >
              <span>💬</span>
              <span>{log.comments.length}</span>
            </Button>
          </div>

          {expandedComments && (
            <CommentSection
              activityLogId={log.id}
              postOwnerId={log.user_id}
              comments={log.comments}
              currentUserId={currentUserId}
            />
          )}
        </CardContent>
      </Card>

      {editingPost && (
        <PostEditDialog
          open={editingPost}
          onOpenChange={setEditingPost}
          post={log}
        />
      )}
    </>
  )
}

export const ActivityLogCard = memo(ActivityLogCardInner, (prevProps, nextProps) => {
  return (
    prevProps.log.id === nextProps.log.id &&
    prevProps.log.likes.length === nextProps.log.likes.length &&
    prevProps.log.comments.length === nextProps.log.comments.length &&
    prevProps.isFollowing === nextProps.isFollowing &&
    prevProps.currentUserId === nextProps.currentUserId
  )
})
