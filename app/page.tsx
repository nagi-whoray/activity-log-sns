import { createClient } from '@/lib/supabase/server'
import { ActivityLogList } from '@/components/activity-log-list'
import { ActivityLogForm } from '@/components/activity-log-form'
import { Header } from '@/components/header'
import { TimelineTabs } from '@/components/timeline-tabs'

export default async function Home({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const activeTab = searchParams.tab === 'following' ? 'following' : 'all'

  // 自分のプロフィール情報を取得（ヘッダー表示用）
  let profileName: string | undefined
  if (user) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single()
    profileName = myProfile?.display_name || myProfile?.username
  }

  // フォロー中のユーザーIDを取得
  let followingIds: string[] = []
  if (user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    followingIds = (follows || []).map((f) => f.following_id)
  }

  // 活動ログ一覧を取得
  let activityLogs = null
  if (activeTab === 'following' && followingIds.length === 0) {
    // 誰もフォローしていない場合はクエリをスキップ
    activityLogs = []
  } else {
    let query = supabase
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
      .order('created_at', { ascending: false })
      .limit(50)

    if (activeTab === 'following') {
      query = query.in('user_id', followingIds)
    }

    const { data } = await query
    activityLogs = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} profileName={profileName} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <ActivityLogForm />
          <TimelineTabs activeTab={activeTab} />
          <ActivityLogList
            activityLogs={activityLogs || []}
            currentUserId={user?.id || null}
            followingIds={followingIds}
            activeTab={activeTab}
          />
        </div>
      </main>
    </div>
  )
}
