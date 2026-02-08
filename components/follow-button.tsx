'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
  isFollowing: boolean
}

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing: initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  const handleToggleFollow = async () => {
    setLoading(true)

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)

        if (error) throw error

        // 通知も削除（失敗は無視）
        try {
          await supabase
            .from('notifications')
            .delete()
            .eq('actor_id', currentUserId)
            .eq('user_id', targetUserId)
            .eq('type', 'follow')
        } catch {
          // 通知削除失敗は無視
        }

        setIsFollowing(false)
      } else {
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        })

        if (error) throw error

        // フォロー通知を作成（失敗は無視）
        try {
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: currentUserId,
            type: 'follow',
          })
        } catch {
          // 通知作成失敗は無視
        }

        setIsFollowing(true)
      }

      router.refresh()
    } catch (error) {
      console.error('Follow error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggleFollow}
      disabled={loading}
      className="text-xs h-7 px-3"
    >
      {loading ? '...' : isFollowing ? 'フォロー中' : 'フォロー'}
    </Button>
  )
}
