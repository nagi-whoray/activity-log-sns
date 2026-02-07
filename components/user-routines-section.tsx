'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, History } from 'lucide-react'
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
  const [isPastExpanded, setIsPastExpanded] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // アクティブと過去のルーティンを分離
  const activeRoutines = routines.filter(r => !r.ended_at)
  const pastRoutines = routines.filter(r => r.ended_at)

  // ソート: アクティブは開始日順、過去は終了日順
  const sortedActiveRoutines = [...activeRoutines].sort((a, b) => {
    return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  })
  const sortedPastRoutines = [...pastRoutines].sort((a, b) => {
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
            ルーティン
            <span className="text-sm font-normal text-muted-foreground">
              ({activeRoutines.length}件実施中)
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
          {/* アクティブなルーティン */}
          {sortedActiveRoutines.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {isOwnProfile
                ? 'ルーティンを追加してみましょう'
                : 'まだルーティンがありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedActiveRoutines.map((routine) => (
                <UserRoutineCard
                  key={routine.id}
                  routine={routine}
                  isOwnProfile={isOwnProfile}
                  userId={userId}
                />
              ))}
            </div>
          )}

          {/* 過去のルーティン（折りたたみ） */}
          {pastRoutines.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setIsPastExpanded(!isPastExpanded)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <History className="w-4 h-4" />
                <span>過去のルーティン（{pastRoutines.length}件）</span>
                {isPastExpanded ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>

              {isPastExpanded && (
                <div className="mt-3 space-y-3">
                  {sortedPastRoutines.map((routine) => (
                    <UserRoutineCard
                      key={routine.id}
                      routine={routine}
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
        <UserRoutineFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          userId={userId}
        />
      )}
    </Card>
  )
}
