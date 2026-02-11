import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { ActivityLogCard, ActivityLogData } from '@/components/activity-log-card'
import { ChevronLeft } from 'lucide-react'

export default async function ActivityLogDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 単一の投稿を取得
  const { data: activityLog } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      ),
      likes (
        id,
        user_id,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      ),
      comments (
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
        ),
        comment_likes (
          id,
          user_id
        )
      ),
      routine:user_routines (
        id,
        title
      )
    `)
    .eq('id', params.id)
    .single()

  if (!activityLog) {
    notFound()
  }

  // 投稿者をフォローしているかチェック
  let isFollowing = false
  if (user && user.id !== activityLog.user_id) {
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', activityLog.user_id)
      .single()

    isFollowing = !!followData
  }

  // ヘッダー用のプロフィール名
  let profileName: string | undefined
  if (user) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()
    profileName = myProfile?.display_name || myProfile?.username || undefined
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} profileName={profileName} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            タイムラインに戻る
          </Link>

          <ActivityLogCard
            log={activityLog as ActivityLogData}
            currentUserId={user?.id || null}
            isFollowing={isFollowing}
            defaultExpandComments
          />
        </div>
      </main>
    </div>
  )
}
