'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS, LogType, LOG_TYPE_LABELS, UserRoutine } from '@/types/database'
import { ImageUpload, ImagePreview } from '@/components/ImageUpload'
import { uploadMultipleImagesWithProgress } from '@/lib/supabase-storage'
import { Progress } from '@/components/ui/progress'
import { EncouragementModal } from '@/components/encouragement-modal'
import { RoutineSelector } from '@/components/routine-selector'
import { ChevronDown, ChevronUp, PenSquare } from 'lucide-react'

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
  { value: 'meal', label: ACTIVITY_CATEGORY_LABELS.meal, icon: '🍽️' },
  { value: 'work', label: ACTIVITY_CATEGORY_LABELS.work, icon: '💼' },
  { value: 'dev', label: ACTIVITY_CATEGORY_LABELS.dev, icon: '💻' },
]

interface ActivityLogFormProps {
  userRoutines?: UserRoutine[]
}

export function ActivityLogForm({ userRoutines = [] }: ActivityLogFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [logType, setLogType] = useState<LogType>('activity')
  const [category, setCategory] = useState<ActivityCategory>('workout')
  const [content, setContent] = useState('')
  const [selectedRoutine, setSelectedRoutine] = useState<UserRoutine | null>(null)
  const [activityDate, setActivityDate] = useState(
    toLocalDateString(new Date())
  )
  const [activityDurationMinutes, setActivityDurationMinutes] = useState<string>('')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [isImagePrivate, setIsImagePrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [submittedLogType, setSubmittedLogType] = useState<LogType>('activity')
  const router = useRouter()
  const supabase = createClient()

  const isCompressing = images.some((img) => img.isCompressing)

  const handleRoutineSelect = (routine: UserRoutine | null) => {
    setSelectedRoutine(routine)
    if (routine) {
      setCategory(routine.category)
      if (routine.duration_minutes) {
        setActivityDurationMinutes(String(routine.duration_minutes))
      }
      if (routine.content) {
        setContent(routine.content)
      }
    }
  }

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
        .select('id, display_name, username')
        .eq('id', user.id)
        .single()

      const emailPrefix = user.email?.split('@')[0]

      if (!profile) {
        // プロフィールを作成（display_nameはAIが生成）
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          username: emailPrefix || 'user',
        })
        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('プロフィールの作成に失敗しました')
        }

        // AIにユーモアのある名前を生成してもらう
        try {
          await fetch('/api/generate-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
            credentials: 'include',
          })
        } catch (nameError) {
          console.error('Name generation error:', nameError)
          // 名前生成に失敗しても続行
        }
      } else {
        // display_nameがNULL、またはメールプレフィックスと同じ場合は名前を生成
        const needsNameGeneration = !profile.display_name ||
          profile.display_name === profile.username ||
          profile.display_name === emailPrefix

        if (needsNameGeneration) {
          try {
            await fetch('/api/generate-name', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
              credentials: 'include',
            })
          } catch (nameError) {
            console.error('Name generation error:', nameError)
            // 名前生成に失敗しても続行
          }
        }
      }

      // 画像をアップロード
      let imageUrls: string[] = []
      const imagesToUpload = images
        .filter((img) => img.compressedFile)
        .map((img) => img.compressedFile as File)

      if (imagesToUpload.length > 0) {
        setUploadProgress({ completed: 0, total: imagesToUpload.length })
        const uploadResults = await uploadMultipleImagesWithProgress(
          imagesToUpload,
          user.id,
          (completed, total) => setUploadProgress({ completed, total })
        )
        imageUrls = uploadResults.map((result) => result.url)
        setUploadProgress(null)
      }

      const durationMinutes = activityDurationMinutes ? parseInt(activityDurationMinutes, 10) : null

      const { data: insertedLog, error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        category,
        title: '',
        content: content.trim(),
        activity_date: activityDate,
        activity_duration_minutes: logType === 'activity' ? durationMinutes : null,
        image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        is_image_private: imageUrls.length > 0 ? isImagePrivate : false,
        log_type: logType,
        routine_id: selectedRoutine?.id || null,
      }).select('id').single()

      if (error) throw error

      // プレビューURLを解放
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))

      setContent('')
      setActivityDate(toLocalDateString(new Date()))
      setActivityDurationMinutes('')
      setImages([])
      setIsImagePrivate(false)
      setSelectedRoutine(null)

      // モーダルを表示してメッセージを生成
      setSubmittedLogType(logType)
      setShowModal(true)
      setIsGenerating(true)

      try {
        const res = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logType,
            category,
            content: content.trim(),
            userId: user.id,
            logId: insertedLog?.id,
            activityDurationMinutes: logType === 'activity' ? durationMinutes : null
          })
        })
        const data = await res.json()
        setModalMessage(data.message || (logType === 'achievement'
          ? '素晴らしい達成を記録しました！'
          : '活動を記録しました。継続は力なり！'))
      } catch {
        setModalMessage(logType === 'achievement'
          ? '素晴らしい達成を記録しました！'
          : '活動を記録しました。継続は力なり！')
      } finally {
        setIsGenerating(false)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '投稿に失敗しました'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setModalMessage('')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenSquare className="w-5 h-5" />
            {isExpanded
              ? (logType === 'activity' ? '活動を記録する' : '達成を記録する')
              : '新しい投稿を作成'
            }
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
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

          {/* ルーティン選択（活動ログで、ルーティンがある場合のみ） */}
          {logType === 'activity' && userRoutines.length > 0 && (
            <div className="space-y-2">
              <Label>ルーティン（任意）</Label>
              <RoutineSelector
                routines={userRoutines}
                selectedRoutineId={selectedRoutine?.id || null}
                onSelect={handleRoutineSelect}
                disabled={loading}
              />
            </div>
          )}

          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`py-2 px-2 sm:px-3 rounded-lg border-2 transition-all whitespace-nowrap ${
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

          {/* 活動時間（活動ログの場合のみ） */}
          {logType === 'activity' && (
            <div className="space-y-2">
              <Label htmlFor="activityDuration">活動時間（任意）</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="activityDuration"
                  value={activityDurationMinutes}
                  onChange={(e) => setActivityDurationMinutes(e.target.value)}
                  placeholder="例: 30"
                  min="1"
                  max="1440"
                  disabled={loading}
                  className="w-24 h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm text-muted-foreground">分</span>
              </div>
            </div>
          )}

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

          {/* 画像の公開設定 */}
          {images.length > 0 && (
            <div className="space-y-2">
              <Label>画像の公開設定</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImagePrivate(false)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    !isImagePrivate
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">🌐</span>
                  <span className="ml-1 text-sm font-medium">公開</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImagePrivate(true)}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    isImagePrivate
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">🔒</span>
                  <span className="ml-1 text-sm font-medium">非公開</span>
                </button>
              </div>
              {isImagePrivate && (
                <p className="text-xs text-muted-foreground">
                  非公開にすると、他のユーザーには画像が表示されず、非公開の画像があることだけが伝わります。
                </p>
              )}
            </div>
          )}

          {/* アップロード進捗バー */}
          {uploadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>画像アップロード中...</span>
                <span>{uploadProgress.completed}/{uploadProgress.total}</span>
              </div>
              <Progress value={(uploadProgress.completed / uploadProgress.total) * 100} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !content.trim() || isCompressing}
          >
            {loading
              ? uploadProgress
                ? `アップロード中 (${uploadProgress.completed}/${uploadProgress.total})...`
                : '投稿中...'
              : isCompressing
                ? '画像を処理中...'
                : '投稿する'}
          </Button>
        </form>
      </CardContent>
      )}

      <EncouragementModal
        open={showModal}
        onClose={handleModalClose}
        logType={submittedLogType}
        message={modalMessage}
        isLoading={isGenerating}
      />
    </Card>
  )
}
