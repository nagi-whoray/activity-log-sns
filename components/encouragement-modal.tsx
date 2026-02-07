'use client'

import { useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogType } from '@/types/database'

// 達成ログ用絵文字
const ACHIEVEMENT_TITLE_EMOJIS = ['🏆', '🎊', '👑', '🥇', '⭐']
const ACHIEVEMENT_BODY_EMOJIS = ['🎉', '🎊', '✨', '🌟', '💫', '🥳']

// 活動ログ用絵文字
const ACTIVITY_TITLE_EMOJIS = ['💪', '🔥', '⚡', '🌈', '🚀']
const ACTIVITY_BODY_EMOJIS = ['✨', '🌟', '💫', '🙌', '👏', '🎯']

function getRandomEmoji(emojis: string[]): string {
  return emojis[Math.floor(Math.random() * emojis.length)]
}

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

  // モーダルが開くたびに新しい絵文字を選択
  const { titleEmoji, bodyEmoji } = useMemo(() => {
    if (isAchievement) {
      return {
        titleEmoji: getRandomEmoji(ACHIEVEMENT_TITLE_EMOJIS),
        bodyEmoji: getRandomEmoji(ACHIEVEMENT_BODY_EMOJIS)
      }
    }
    return {
      titleEmoji: getRandomEmoji(ACTIVITY_TITLE_EMOJIS),
      bodyEmoji: getRandomEmoji(ACTIVITY_BODY_EMOJIS)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAchievement])

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
            {isAchievement ? `${titleEmoji} 達成おめでとう！` : `${titleEmoji} お疲れさまです！`}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className={`text-6xl mb-4 ${isAchievement ? 'animate-bounce' : ''}`}>
            {bodyEmoji}
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
