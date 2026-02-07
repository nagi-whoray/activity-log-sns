'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ActivityLogCard, ActivityLogData } from '@/components/activity-log-card'
import { TabType } from '@/components/timeline-tabs'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface ActivityLogListClientProps {
  initialLogs: ActivityLogData[]
  initialCursor: string | null
  initialHasMore: boolean
  filters: {
    tab: TabType
    category: ActivityCategory | null
    userId?: string
    date?: string
  }
  currentUserId: string | null
  followingIds: string[]
}

export function ActivityLogListClient({
  initialLogs,
  initialCursor,
  initialHasMore,
  filters,
  currentUserId,
  followingIds,
}: ActivityLogListClientProps) {
  const [logs, setLogs] = useState<ActivityLogData[]>(initialLogs)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // フィルターが変わったら初期データにリセット
  useEffect(() => {
    setLogs(initialLogs)
    setCursor(initialCursor)
    setHasMore(initialHasMore)
  }, [initialLogs, initialCursor, initialHasMore])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return

    setIsLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('cursor', cursor)
      params.set('tab', filters.tab)
      if (filters.category) params.set('category', filters.category)
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.date) params.set('date', filters.date)

      const response = await fetch(`/api/activity-logs?${params.toString()}`)
      const data = await response.json()

      if (data.logs) {
        setLogs((prev) => [...prev, ...data.logs])
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error loading more logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cursor, hasMore, isLoading, filters])

  // Intersection Observerで自動読み込み
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoading, loadMore])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLikeUpdate = useCallback((logId: string, isLiked: boolean) => {
    // 楽観的更新はActivityLogCard内で処理済み
  }, [])

  const handleDelete = useCallback((logId: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== logId))
  }, [])

  if (logs.length === 0) {
    const getEmptyMessage = () => {
      const categoryLabel = filters.category ? ACTIVITY_CATEGORY_LABELS[filters.category] : null

      if (filters.tab === 'following') {
        return {
          main: 'フォロー中のユーザーの投稿がありません',
          sub: '「全部」タブからユーザーをフォローしてみましょう！'
        }
      } else if (filters.tab === 'activity') {
        return {
          main: categoryLabel ? `${categoryLabel}の活動ログがありません` : '活動ログがありません',
          sub: '最初の活動を記録してみましょう！'
        }
      } else if (filters.tab === 'achievement') {
        return {
          main: categoryLabel ? `${categoryLabel}の達成ログがありません` : '達成ログがありません',
          sub: '達成したことを記録してみましょう！'
        }
      } else {
        return {
          main: categoryLabel ? `${categoryLabel}のログがありません` : 'まだログがありません',
          sub: '最初の記録をしてみましょう！'
        }
      }
    }

    const message = getEmptyMessage()

    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{message.main}</p>
        <p className="text-sm text-muted-foreground mt-2">{message.sub}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <ActivityLogCard
          key={log.id}
          log={log}
          currentUserId={currentUserId}
          isFollowing={followingIds.includes(log.user_id)}
          onLikeUpdate={handleLikeUpdate}
          onDelete={handleDelete}
        />
      ))}

      {/* 読み込みトリガー */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">読み込み中...</span>
          </div>
        )}
        {!hasMore && logs.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            これ以上の投稿はありません
          </p>
        )}
      </div>
    </div>
  )
}
