'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserItemCard } from '@/components/user-item-card'
import { UserItemFormDialog } from '@/components/user-item-form-dialog'
import { UserItem } from '@/types/database'

interface UserItemsSectionProps {
  items: UserItem[]
  isOwnProfile: boolean
  userId: string
}

export function UserItemsSection({ items, isOwnProfile, userId }: UserItemsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPastExpanded, setIsPastExpanded] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // アクティブと過去のアイテムを分離
  const activeItems = items.filter(item => !item.ended_at)
  const pastItems = items.filter(item => item.ended_at)

  // ソート: アクティブは開始日順、過去は終了日順
  const sortedActiveItems = [...activeItems].sort((a, b) => {
    return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  })
  const sortedPastItems = [...pastItems].sort((a, b) => {
    return new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime()
  })

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            マイアイテム
            <span className="text-sm font-normal text-muted-foreground">
              ({activeItems.length}件利用中)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* アクティブなアイテム */}
          {sortedActiveItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isOwnProfile
                ? '利用中のアイテムを追加してみましょう'
                : 'まだアイテムがありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedActiveItems.map((item) => (
                <UserItemCard
                  key={item.id}
                  item={item}
                  isOwnProfile={isOwnProfile}
                  userId={userId}
                />
              ))}
            </div>
          )}

          {/* 過去のアイテム（折りたたみ） */}
          {pastItems.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setIsPastExpanded(!isPastExpanded)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <History className="w-4 h-4" />
                <span>過去のアイテム（{pastItems.length}件）</span>
                {isPastExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>

              {isPastExpanded && (
                <div className="mt-3 space-y-3">
                  {sortedPastItems.map((item) => (
                    <UserItemCard
                      key={item.id}
                      item={item}
                      isOwnProfile={isOwnProfile}
                      userId={userId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}

      {showAddDialog && (
        <UserItemFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          userId={userId}
        />
      )}
    </Card>
  )
}
