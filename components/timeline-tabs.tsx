'use client'

import { useRouter, usePathname } from 'next/navigation'

interface TimelineTabsProps {
  activeTab: 'all' | 'following'
}

export function TimelineTabs({ activeTab }: TimelineTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleTabChange = (tab: 'all' | 'following') => {
    if (tab === 'all') {
      router.push(pathname)
    } else {
      router.push(`${pathname}?tab=following`)
    }
  }

  return (
    <div className="flex border-b border-gray-200 bg-white rounded-t-lg">
      <button
        onClick={() => handleTabChange('all')}
        className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
          activeTab === 'all'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        全ての投稿
      </button>
      <button
        onClick={() => handleTabChange('following')}
        className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
          activeTab === 'following'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        フォロー中
      </button>
    </div>
  )
}
