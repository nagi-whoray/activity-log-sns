'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { NotificationButton } from '@/components/notification-button'

interface HeaderProps {
  user: User | null
  profileName?: string
}

export function Header({ user, profileName }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto max-w-2xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/recowork-logo.png" alt="Recowork" width={28} height={28} />
              <span className="text-xl font-bold">Recowork</span>
            </Link>
            {user && profileName && (
              <p className="text-sm text-muted-foreground">{profileName}</p>
            )}
          </div>
          {user && (
            <>
              {/* Desktop menu */}
              <div className="hidden sm:flex items-center gap-2">
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
                <NotificationButton />
                <Button variant="outline" onClick={handleSignOut}>
                  ログアウト
                </Button>
              </div>

              {/* Mobile: Notification + Hamburger */}
              <div className="sm:hidden flex items-center gap-2">
                <NotificationButton />
                <button
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu */}
        {user && isMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t flex flex-col gap-2">
            <Link href="/" onClick={closeMenu}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                タイムライン
              </Button>
            </Link>
            <Link href={`/users/${user.id}`} onClick={closeMenu}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                マイページ
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              ログアウト
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
