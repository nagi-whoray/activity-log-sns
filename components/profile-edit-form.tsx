'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
          avatar_url: newAvatarUrl,
          background_url: newBackgroundUrl,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      router.push(`/users/${profile.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayNameForInitial = displayName || profile.username

  return (
    <>
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
                未設定の場合はユーザー名（@{profile.username}）が表示されます
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
