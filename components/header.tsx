'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  user: User | null
  profileName?: string
}

export function Header({ user, profileName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto max-w-2xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
              Activity Log SNS
            </Link>
            {user && profileName && (
              <p className="text-sm text-muted-foreground">{profileName}</p>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  タイムライン
                </Button>
              </Link>
              <Link href={`/users/${user.id}`}>
                <Button variant="ghost" size="sm">
                  マイページ
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                ログアウト
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
