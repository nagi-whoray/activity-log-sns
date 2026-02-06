'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'

export type TabType = 'all' | 'activity' | 'achievement' | 'following'

interface TimelineTabsProps {
  activeTab: TabType
  activeCategory: ActivityCategory | null
}

const TABS: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'activity', label: '活動ログ' },
  { key: 'achievement', label: '達成ログ' },
  { key: 'following', label: 'フォロー中' },
]

const CATEGORIES: { value: ActivityCategory | null; label: string; icon: string }[] = [
  { value: null, label: '全て', icon: '' },
  { value: 'workout', label: ACTIVITY_CATEGORY_LABELS.workout, icon: '💪' },
  { value: 'study', label: ACTIVITY_CATEGORY_LABELS.study, icon: '📚' },
  { value: 'beauty', label: ACTIVITY_CATEGORY_LABELS.beauty, icon: '✨' },
]

export function TimelineTabs({ activeTab, activeCategory }: TimelineTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString())

    if (tab === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  const handleCategoryChange = (category: ActivityCategory | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (category === null) {
      params.delete('category')
    } else {
      params.set('category', category)
    }

    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* 第1段階: ログタイプタブ */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 第2段階: カテゴリフィルタ */}
      <div className="flex gap-2 p-3 bg-gray-50">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value ?? 'all'}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
