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

interface AchievementCelebrationModalProps {
  open: boolean
  onClose: () => void
}

export function AchievementCelebrationModal({ open, onClose }: AchievementCelebrationModalProps) {
  useEffect(() => {
    if (open) {
      // 紙吹雪アニメーション発火
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
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🏆 達成おめでとう！
          </DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <p className="text-6xl mb-4 animate-bounce">🎉</p>
          <p className="text-muted-foreground">
            素晴らしい達成を記録しました！
          </p>
          <p className="text-muted-foreground mt-1">
            この調子で頑張りましょう！
          </p>
        </div>
        <Button onClick={onClose} className="w-full">
          閉じる
        </Button>
      </DialogContent>
    </Dialog>
  )
}
