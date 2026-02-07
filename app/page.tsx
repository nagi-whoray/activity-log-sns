import { createClient } from '@/lib/supabase/server'
import { ActivityLogListClient } from '@/components/activity-log-list-client'
import { ActivityLogForm } from '@/components/activity-log-form'
import { Header } from '@/components/header'
import { TimelineTabs, TabType } from '@/components/timeline-tabs'
import { ActivityCategory } from '@/types/database'

const PAGE_SIZE = 20

export default async function Home({
  searchParams,
}: {
  searchParams: { tab?: string; category?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // タブパラメータの解析
  const tabParam = searchParams.tab
  let activeTab: TabType = 'all'
  if (tabParam === 'following') activeTab = 'following'
  else if (tabParam === 'activity') activeTab = 'activity'
  else if (tabParam === 'achievement') activeTab = 'achievement'

  // カテゴリパラメータの解析
  const categoryParam = searchParams.category
  let activeCategory: ActivityCategory | null = null
  if (categoryParam === 'workout' || categoryParam === 'study' || categoryParam === 'beauty') {
    activeCategory = categoryParam
  }

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
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    // ログタイプでフィルタリング
    if (activeTab === 'following') {
      query = query.in('user_id', followingIds)
    } else if (activeTab === 'activity') {
      query = query.eq('log_type', 'activity')
    } else if (activeTab === 'achievement') {
      query = query.eq('log_type', 'achievement')
    }
    // 'all' は両方表示なのでフィルタなし

    // カテゴリでフィルタリング
    if (activeCategory) {
      query = query.eq('category', activeCategory)
    }

    const { data } = await query
    activityLogs = data
  }

  // ページネーション用の処理
  const hasMore = (activityLogs?.length || 0) > PAGE_SIZE
  const resultLogs = hasMore ? activityLogs?.slice(0, PAGE_SIZE) : activityLogs
  const nextCursor = hasMore && resultLogs && resultLogs.length > 0
    ? resultLogs[resultLogs.length - 1].created_at
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} profileName={profileName} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <ActivityLogForm />
          <TimelineTabs activeTab={activeTab} activeCategory={activeCategory} />
          <ActivityLogListClient
            initialLogs={resultLogs || []}
            initialCursor={nextCursor}
            initialHasMore={hasMore}
            filters={{
              tab: activeTab,
              category: activeCategory,
            }}
            currentUserId={user?.id || null}
            followingIds={followingIds}
          />
        </div>
      </main>
    </div>
  )
}
