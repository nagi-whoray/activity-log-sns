import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { UserProfileHeader } from '@/components/user-profile-header'
import { ActivityLogList } from '@/components/activity-log-list'

export default async function UserProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('id', params.id)
    .single()

  if (!profile) {
    notFound()
  }

  // このユーザーの活動ログを取得
  const { data: activityLogs } = await supabase
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
        user_id
      ),
      comments (
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
      )
    `)
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // フォロワー数を取得
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', params.id)

  // フォロー中数を取得
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', params.id)

  // 現在のユーザーがフォローしているユーザーID一覧を取得
  let isFollowing = false
  let followingIds: string[] = []
  if (user) {
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    followingIds = (followData || []).map((f) => f.following_id)
    isFollowing = followingIds.includes(params.id)
  }

  const isOwnProfile = user?.id === params.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <UserProfileHeader
            profile={profile}
            postCount={activityLogs?.length || 0}
            followerCount={followerCount || 0}
            followingCount={followingCount || 0}
            isOwnProfile={isOwnProfile}
            currentUserId={user?.id || null}
            isFollowing={isFollowing}
          />
          <ActivityLogList
            activityLogs={activityLogs || []}
            currentUserId={user?.id || null}
            followingIds={followingIds}
          />
        </div>
      </main>
    </div>
  )
}
