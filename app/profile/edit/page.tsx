import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { ProfileEditForm } from '@/components/profile-edit-form'

export default async function ProfileEditPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, background_url')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} profileName={profile.display_name || profile.username} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>
        <ProfileEditForm profile={profile} />
      </main>
    </div>
  )
}
