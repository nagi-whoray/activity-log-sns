'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { ImagePlus, X, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileImage } from '@/lib/supabase-storage'
import { ALLOWED_IMAGE_TYPES, AllowedImageType } from '@/types/storage'
import { ImageCropDialog } from '@/components/image-crop-dialog'

interface ProfileEditFormProps {
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    background_url: string | null
    goal: string | null
    ai_prompt: string | null
    ai_tone: string | null
  }
}

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [goal, setGoal] = useState(profile.goal || '')
  const [aiPrompt, setAiPrompt] = useState(profile.ai_prompt || '')
  const [aiTone, setAiTone] = useState(profile.ai_tone || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(profile.background_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // クロップダイアログ用のstate
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string>('')
  const [cropType, setCropType] = useState<'avatar' | 'background'>('avatar')

  // アカウント削除用のstate
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'background'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイル形式のみチェック（サイズは圧縮するので制限しない）
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
      setError('対応している画像形式: JPEG, PNG, GIF, WebP')
      return
    }

    setError(null)
    const imageUrl = URL.createObjectURL(file)
    setCropImageSrc(imageUrl)
    setCropType(type)
    setCropDialogOpen(true)

    // inputをリセット（同じファイルを再選択できるように）
    if (type === 'avatar' && avatarInputRef.current) {
      avatarInputRef.current.value = ''
    } else if (type === 'background' && backgroundInputRef.current) {
      backgroundInputRef.current.value = ''
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    setCropDialogOpen(false)

    const setPreview = cropType === 'avatar' ? setAvatarPreview : setBackgroundPreview
    const setFile = cropType === 'avatar' ? setAvatarFile : setBackgroundFile

    // 切り抜き後の画像をプレビュー表示
    const previewUrl = URL.createObjectURL(croppedFile)
    setPreview(previewUrl)

    // 圧縮
    try {
      const compressed = await imageCompression(croppedFile, compressionOptions)
      setFile(compressed)
    } catch {
      setFile(croppedFile)
    }

    // クロップ用の元画像URLを解放
    URL.revokeObjectURL(cropImageSrc)
  }

  const handleCropClose = () => {
    setCropDialogOpen(false)
    URL.revokeObjectURL(cropImageSrc)
  }

  const handleRemoveImage = (type: 'avatar' | 'background') => {
    if (type === 'avatar') {
      setAvatarPreview(null)
      setAvatarFile(null)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    } else {
      setBackgroundPreview(null)
      setBackgroundFile(null)
      if (backgroundInputRef.current) backgroundInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      let newAvatarUrl = profile.avatar_url
      let newBackgroundUrl = profile.background_url

      // アバター画像のアップロード
      if (avatarFile) {
        const result = await uploadProfileImage(avatarFile, profile.id, 'avatar', profile.avatar_url)
        newAvatarUrl = result.url
      } else if (avatarPreview === null && profile.avatar_url) {
        newAvatarUrl = null
      }

      // 背景画像のアップロード
      if (backgroundFile) {
        const result = await uploadProfileImage(backgroundFile, profile.id, 'background', profile.background_url)
        newBackgroundUrl = result.url
      } else if (backgroundPreview === null && profile.background_url) {
        newBackgroundUrl = null
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          goal: goal.trim() || null,
          avatar_url: newAvatarUrl,
          background_url: newBackgroundUrl,
          ai_prompt: aiPrompt.trim() || null,
          ai_tone: aiTone.trim() || null,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // 名前が空の場合、AIで自動生成する
      if (!displayName.trim()) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const nameRes = await fetch('/api/generate-name', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ userId: profile.id }),
            })
            const nameData = await nameRes.json()
            if (nameData.name && nameData.saved) {
              console.log('AI generated name:', nameData.name)
            }
          }
        } catch (nameError) {
          console.error('Name regeneration error:', nameError)
          // 名前生成に失敗しても保存は成功とする
        }
      }

      router.push(`/users/${profile.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの削除に失敗しました')
      }

      // 削除成功 - ログインページへリダイレクト
      router.push('/login')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'アカウントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const displayNameForInitial = displayName || profile.username

  return (
    <>
      {/* 保存中オーバーレイ */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 backdrop-blur-sm px-8 py-6 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-sm font-medium text-gray-700">保存中...</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 背景画像 */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm font-medium">背景画像</Label>
            <div className="mt-2">
              <div className="relative w-full h-36 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-r from-blue-400 to-purple-500">
                {backgroundPreview && (
                  <Image
                    src={backgroundPreview}
                    alt="背景プレビュー"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageSelect(e, 'background')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => backgroundInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  {backgroundPreview ? '変更' : '追加'}
                </Button>
                {backgroundPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage('background')}
                    className="gap-2 text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                    削除
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アイコン画像 */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-sm font-medium">アイコン画像</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="アイコンプレビュー"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                    {displayNameForInitial[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleImageSelect(e, 'avatar')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  className="gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  {avatarPreview ? '変更' : '追加'}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage('avatar')}
                    className="gap-2 text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                    削除
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アカウント名 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-sm font-medium">アカウント名</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile.username}
                maxLength={50}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                未設定の場合はAIがユーモアのある名前をつけます
              </p>
            </div>

            {/* 自己紹介文 */}
            <div>
              <Label htmlFor="bio" className="text-sm font-medium">自己紹介</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介を入力してください"
                maxLength={200}
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {bio.length}/200
              </p>
            </div>

            {/* 今の目標 */}
            <div>
              <Label htmlFor="goal" className="text-sm font-medium flex items-center gap-2">
                <span>🎯</span>
                <span>今の目標</span>
              </Label>
              <textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例: 体脂肪率15%を目指す / TOEIC 900点達成 / 毎日スキンケアを継続"
                maxLength={200}
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {goal.length}/200
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI設定 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="aiPrompt" className="text-sm font-medium flex items-center gap-2">
                <span>🤖</span>
                <span>AIアシスタントに覚えてほしいこと</span>
              </Label>
              <textarea
                id="aiPrompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="例: マラソン完走を目標にトレーニング中 / JLPT N1を来年取得予定 / 週3回の筋トレを習慣化したい"
                maxLength={500}
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {aiPrompt.length}/500
              </p>
            </div>

            <div>
              <Label htmlFor="aiTone" className="text-sm font-medium flex items-center gap-2">
                <span>💬</span>
                <span>AIの口調・スタイル</span>
              </Label>
              <textarea
                id="aiTone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                placeholder="例: コーチのように厳しめに / カジュアルな友達口調で / 褒めて伸ばすタイプで"
                maxLength={200}
                rows={2}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {aiTone.length}/200
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              投稿時にAIが生成する励ましメッセージをカスタマイズできます
            </p>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </div>

        {/* アカウント削除 */}
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-600">アカウントを削除</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  アカウントを削除すると、すべての投稿、コメント、いいね、フォロー関係、ルーティン、アイテムが完全に削除されます。この操作は取り消せません。
                </p>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-3 gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      アカウントを削除
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        アカウントを削除しますか？
                      </DialogTitle>
                      <DialogDescription className="pt-2">
                        この操作は取り消せません。以下のデータがすべて削除されます：
                        <ul className="mt-2 ml-4 list-disc text-left">
                          <li>プロフィール情報</li>
                          <li>すべての投稿と画像</li>
                          <li>コメント・いいね</li>
                          <li>フォロー・フォロワー関係</li>
                          <li>ルーティン・アイテム</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                      <p className="text-sm text-red-500">{deleteError}</p>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isDeleting}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            削除中...
                          </>
                        ) : (
                          '削除する'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* クロップダイアログ */}
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={cropImageSrc}
        aspect={cropType === 'avatar' ? 1 : 40 / 9}
        title={cropType === 'avatar' ? 'アイコン画像の切り抜き' : '背景画像の切り抜き'}
        onClose={handleCropClose}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
