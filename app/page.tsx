import { createClient } from '@/lib/supabase/server'
import { ActivityLogList } from '@/components/activity-log-list'
import { ActivityLogForm } from '@/components/activity-log-form'
import { Header } from '@/components/header'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 活動ログ一覧を取得（プロフィール、いいね、コメント情報も含める）
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
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <ActivityLogForm />
          <ActivityLogList
            activityLogs={activityLogs || []}
            currentUserId={user?.id || null}
          />
        </div>
      </main>
    </div>
  )
}
