'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
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
  const [showAddDialog, setShowAddDialog] = useState(false)

  const sortedItems = [...items].sort((a, b) => {
    if (!a.ended_at && b.ended_at) return -1
    if (a.ended_at && !b.ended_at) return 1
    if (!a.ended_at && !b.ended_at) {
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    }
    return new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime()
  })

  const activeCount = items.filter((item) => !item.ended_at).length

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
              ({activeCount}件利用中)
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
          {sortedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isOwnProfile
                ? '利用中のアイテムを追加してみましょう'
                : 'まだアイテムがありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <UserItemCard
                  key={item.id}
                  item={item}
                  isOwnProfile={isOwnProfile}
                  userId={userId}
                />
              ))}
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
