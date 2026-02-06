import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { UserProfileHeader } from '@/components/user-profile-header'
import { ActivityCalendar } from '@/components/activity-calendar'
import { ActivityLogList } from '@/components/activity-log-list'
import { TimelineTabs, TabType } from '@/components/timeline-tabs'
import { ActivityCategory } from '@/types/database'

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { date?: string; tab?: string; category?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // プロフィール情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, background_url')
    .eq('id', params.id)
    .single()

  if (!profile) {
    notFound()
  }

  // カレンダー用: このユーザーの全投稿日とカテゴリ、ログタイプを取得
  const { data: activityDateRows } = await supabase
    .from('activity_logs')
    .select('activity_date, category, log_type')
    .eq('user_id', params.id)

  const activityDateMap: Record<string, { categories: string[], hasAchievement: boolean }> = {}
  for (const r of activityDateRows || []) {
    if (!activityDateMap[r.activity_date]) {
      activityDateMap[r.activity_date] = { categories: [], hasAchievement: false }
    }
    if (!activityDateMap[r.activity_date].categories.includes(r.category)) {
      activityDateMap[r.activity_date].categories.push(r.category)
    }
    if (r.log_type === 'achievement') {
      activityDateMap[r.activity_date].hasAchievement = true
    }
  }

  const selectedDate = searchParams.date || null

  // タブパラメータの解析（マイページではfollowingは使わない）
  const tabParam = searchParams.tab
  let activeTab: TabType = 'all'
  if (tabParam === 'activity') activeTab = 'activity'
  else if (tabParam === 'achievement') activeTab = 'achievement'

  // カテゴリパラメータの解析
  const categoryParam = searchParams.category
  let activeCategory: ActivityCategory | null = null
  if (categoryParam === 'workout' || categoryParam === 'study' || categoryParam === 'beauty') {
    activeCategory = categoryParam
  }

  // このユーザーの活動ログを取得
  let activityLogsQuery = supabase
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

  if (selectedDate) {
    activityLogsQuery = activityLogsQuery.eq('activity_date', selectedDate)
  }

  // ログタイプでフィルタリング
  if (activeTab === 'activity') {
    activityLogsQuery = activityLogsQuery.eq('log_type', 'activity')
  } else if (activeTab === 'achievement') {
    activityLogsQuery = activityLogsQuery.eq('log_type', 'achievement')
  }

  // カテゴリでフィルタリング
  if (activeCategory) {
    activityLogsQuery = activityLogsQuery.eq('category', activeCategory)
  }

  const { data: activityLogs } = await activityLogsQuery
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
      <Header user={user} profileName={isOwnProfile ? (profile.display_name || profile.username) : undefined} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <UserProfileHeader
            profile={profile}
            postCount={activityDateRows?.length || 0}
            followerCount={followerCount || 0}
            followingCount={followingCount || 0}
            isOwnProfile={isOwnProfile}
            currentUserId={user?.id || null}
            isFollowing={isFollowing}
          />
          <ActivityCalendar
            activityDateMap={activityDateMap}
            selectedDate={selectedDate}
            userId={params.id}
          />
          <TimelineTabs
            activeTab={activeTab}
            activeCategory={activeCategory}
            showFollowingTab={false}
          />
          <ActivityLogList
            activityLogs={activityLogs || []}
            currentUserId={user?.id || null}
            followingIds={followingIds}
            activeTab={activeTab}
            activeCategory={activeCategory}
          />
        </div>
      </main>
    </div>
  )
}
