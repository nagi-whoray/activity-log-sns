import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/post-list'
import { PostForm } from '@/components/post-form'
import { Header } from '@/components/header'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 投稿一覧を取得（プロフィール情報も含める）
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        id,
        username,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <PostForm />
          <PostList posts={posts || []} />
        </div>
      </main>
    </div>
  )
}
