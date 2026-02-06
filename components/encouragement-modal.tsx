'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogType } from '@/types/database'

interface EncouragementModalProps {
  open: boolean
  onClose: () => void
  logType: LogType
  message: string
  isLoading?: boolean
}

export function EncouragementModal({
  open,
  onClose,
  logType,
  message,
  isLoading
}: EncouragementModalProps) {
  const isAchievement = logType === 'achievement'

  useEffect(() => {
    if (open && isAchievement) {
      // 達成ログの場合のみ紙吹雪
      const duration = 2000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [open, isAchievement])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isAchievement ? '🏆 達成おめでとう！' : '💪 お疲れさまです！'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className={`text-6xl mb-4 ${isAchievement ? 'animate-bounce' : ''}`}>
            {isAchievement ? '🎉' : '✨'}
          </p>
          {isLoading ? (
            <p className="text-muted-foreground">メッセージを生成中...</p>
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">{message}</p>
          )}
        </div>
        <Button onClick={onClose} className="w-full" disabled={isLoading}>
          閉じる
        </Button>
      </DialogContent>
    </Dialog>
  )
}
