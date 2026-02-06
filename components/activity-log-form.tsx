'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS, LogType, LOG_TYPE_LABELS } from '@/types/database'
import { ImageUpload, ImagePreview } from '@/components/ImageUpload'
import { uploadMultipleImages } from '@/lib/supabase-storage'
import { AchievementCelebrationModal } from '@/components/achievement-celebration-modal'

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'workout', label: ACTIVITY_CATEGORY_LABELS.workout, icon: '💪' },
  { value: 'study', label: ACTIVITY_CATEGORY_LABELS.study, icon: '📚' },
  { value: 'beauty', label: ACTIVITY_CATEGORY_LABELS.beauty, icon: '✨' },
]

export function ActivityLogForm() {
  const [logType, setLogType] = useState<LogType>('activity')
  const [category, setCategory] = useState<ActivityCategory>('workout')
  const [content, setContent] = useState('')
  const [activityDate, setActivityDate] = useState(
    toLocalDateString(new Date())
  )
  const [images, setImages] = useState<ImagePreview[]>([])
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isCompressing = images.some((img) => img.isCompressing)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (isCompressing) return

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('ログインが必要です')
      }

      // プロフィールが存在するか確認し、なければ自動作成
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'user',
        })
        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('プロフィールの作成に失敗しました')
        }
      }

      // 画像をアップロード
      let imageUrls: string[] = []
      const imagesToUpload = images
        .filter((img) => img.compressedFile)
        .map((img) => img.compressedFile as File)

      if (imagesToUpload.length > 0) {
        const uploadResults = await uploadMultipleImages(imagesToUpload, user.id)
        imageUrls = uploadResults.map((result) => result.url)
      }

      const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        category,
        title: '',
        content: content.trim(),
        activity_date: activityDate,
        image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        log_type: logType,
      })

      if (error) throw error

      // プレビューURLを解放
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))

      setContent('')
      setActivityDate(toLocalDateString(new Date()))
      setImages([])

      // 達成ログの場合はお祝いモーダルを表示
      if (logType === 'achievement') {
        setShowCelebration(true)
      } else {
        router.refresh()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '投稿に失敗しました'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleCelebrationClose = () => {
    setShowCelebration(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{logType === 'activity' ? '活動を記録する' : '達成を記録する'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ログタイプ選択 */}
          <div className="space-y-2">
            <Label>投稿タイプ</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogType('activity')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  logType === 'activity'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">📝</span>
                <span className="ml-1 text-sm font-medium">{LOG_TYPE_LABELS.activity}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogType('achievement')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  logType === 'achievement'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">🏆</span>
                <span className="ml-1 text-sm font-medium">{LOG_TYPE_LABELS.achievement}</span>
              </button>
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex-1 py-2 px-2 sm:px-3 rounded-lg border-2 transition-all whitespace-nowrap ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base sm:text-lg">{cat.icon}</span>
                  <span className="ml-1 text-xs sm:text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 活動日/達成日 */}
          <div className="space-y-2">
            <Label htmlFor="activityDate">{logType === 'activity' ? '活動日' : '達成日'}</Label>
            <select
              id="activityDate"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              disabled={loading}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value={toLocalDateString(new Date())}>今日（{toLocalDateString(new Date()).replace(/-/g, '/')}）</option>
              <option value={toLocalDateString(new Date(Date.now() - 86400000))}>昨日（{toLocalDateString(new Date(Date.now() - 86400000)).replace(/-/g, '/')}）</option>
            </select>
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={logType === 'activity' ? '今日の活動の詳細を記録しましょう...' : '達成内容の詳細を記録しましょう...'}
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={loading}
              maxLength={1000}
            />
            <div className="text-right text-sm text-muted-foreground">
              {content.length}/1000
            </div>
          </div>

          {/* 画像アップロード */}
          <div className="space-y-2">
            <Label>画像（任意）</Label>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !content.trim() || isCompressing}
          >
            {loading ? '投稿中...' : isCompressing ? '画像を処理中...' : '投稿する'}
          </Button>
        </form>
      </CardContent>

      <AchievementCelebrationModal
        open={showCelebration}
        onClose={handleCelebrationClose}
      />
    </Card>
  )
}
