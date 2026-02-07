'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRoutineCard } from '@/components/user-routine-card'
import { UserRoutineFormDialog } from '@/components/user-routine-form-dialog'
import { UserRoutine } from '@/types/database'

interface UserRoutinesSectionProps {
  routines: UserRoutine[]
  isOwnProfile: boolean
  userId: string
}

export function UserRoutinesSection({ routines, isOwnProfile, userId }: UserRoutinesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const sortedRoutines = [...routines].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            ルーティン
            <span className="text-sm font-normal text-muted-foreground">
              ({routines.length}件)
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
          {sortedRoutines.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isOwnProfile
                ? 'ルーティンを追加してみましょう'
                : 'まだルーティンがありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedRoutines.map((routine) => (
                <UserRoutineCard
                  key={routine.id}
                  routine={routine}
                  isOwnProfile={isOwnProfile}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}

      {showAddDialog && (
        <UserRoutineFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          userId={userId}
        />
      )}
    </Card>
  )
}
