'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react'
import type { NotificationWithDetails, NotificationType } from '@/types/database'

interface NotificationDropdownProps {
  onClose: () => void
  onMarkRead: () => void
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-red-500" />,
  comment: <MessageCircle className="w-4 h-4 text-blue-500" />,
  follow: <UserPlus className="w-4 h-4 text-purple-500" />,
  comment_like: <Heart className="w-4 h-4 text-pink-400" />,
  comment_reply: <MessageCircle className="w-4 h-4 text-green-500" />,
}

export function NotificationDropdown({ onClose, onMarkRead }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()

    // 外側クリックで閉じる
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('通知取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onMarkRead()
    } catch (error) {
      console.error('全既読エラー:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationWithDetails) => {
    if (!notification.is_read) {
      try {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id }),
        })
        onMarkRead()
      } catch (error) {
        console.error('既読エラー:', error)
      }
    }
    onClose()
  }

  const getNotificationMessage = (n: NotificationWithDetails) => {
    const actorName = n.actor?.display_name || n.actor?.username || '誰か'
    switch (n.type) {
      case 'like':
        return `${actorName}さんがあなたの投稿にいいねしました`
      case 'comment':
        return `${actorName}さんがあなたの投稿にコメントしました`
      case 'follow':
        return `${actorName}さんがあなたをフォローしました`
      case 'comment_like':
        return `${actorName}さんがあなたのコメントにいいねしました`
      case 'comment_reply':
        return `${actorName}さんがあなたのコメントに返信しました`
    }
  }

  const getNotificationLink = (n: NotificationWithDetails) => {
    if (n.type === 'follow') {
      return `/users/${n.actor_id}`
    }
    // いいね・コメントは投稿詳細ページへ遷移
    if (n.activity_log_id) {
      return `/activity-logs/${n.activity_log_id}`
    }
    return '/'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <Card
      ref={dropdownRef}
      className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[70vh] overflow-hidden z-50 shadow-lg"
    >
      <div className="p-3 border-b flex justify-between items-center sticky top-0 bg-white">
        <h3 className="font-semibold">通知</h3>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
            すべて既読
          </Button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(70vh-52px)]">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>通知はありません</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notification => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
                className={`block p-3 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                      {notification.actor?.avatar_url ? (
                        <Image
                          src={notification.actor.avatar_url}
                          alt=""
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{getNotificationMessage(notification)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
