'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/database'
import { ImageUpload, ImagePreview } from '@/components/ImageUpload'
import { uploadMultipleImages, deleteMultipleImages, extractPathFromUrl } from '@/lib/supabase-storage'

interface ExistingImage {
  url: string
  path: string | null
}

interface PostEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: {
    id: string
    category: ActivityCategory
    content: string
    image_url: string | null
    user_id: string
  }
}

function parseExistingImages(imageUrl: string | null): ExistingImage[] {
  if (!imageUrl) return []
  try {
    const urls = JSON.parse(imageUrl)
    if (Array.isArray(urls)) {
      return urls.map((url: string) => ({
        url,
        path: extractPathFromUrl(url),
      }))
    }
  } catch {
    // ignore parse error
  }
  return []
}

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'workout', label: ACTIVITY_CATEGORY_LABELS.workout, icon: '💪' },
  { value: 'study', label: ACTIVITY_CATEGORY_LABELS.study, icon: '📚' },
  { value: 'beauty', label: ACTIVITY_CATEGORY_LABELS.beauty, icon: '✨' },
]

export function PostEditDialog({ open, onOpenChange, post }: PostEditDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [category, setCategory] = useState<ActivityCategory>(post.category)
  const [content, setContent] = useState(post.content)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [newImages, setNewImages] = useState<ImagePreview[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory(post.category)
      setContent(post.content)
      setExistingImages(parseExistingImages(post.image_url))
      setImagesToDelete([])
      setNewImages([])
    }
  }, [open, post])

  const remainingSlots = 3 - existingImages.length - newImages.length
  const isCompressing = newImages.some((img) => img.isCompressing)

  const handleRemoveExisting = (index: number) => {
    const image = existingImages[index]
    if (image.path) {
      setImagesToDelete((prev) => [...prev, image.path!])
    }
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isCompressing) return

    setLoading(true)

    try {
      let finalImageUrls = existingImages.map((img) => img.url)

      if (newImages.length > 0) {
        const imagesToUpload = newImages
          .filter((img) => img.compressedFile)
          .map((img) => img.compressedFile as File)

        if (imagesToUpload.length > 0) {
          const uploadResults = await uploadMultipleImages(imagesToUpload, post.user_id)
          finalImageUrls = [...finalImageUrls, ...uploadResults.map((r) => r.url)]
        }
      }

      const { error } = await supabase
        .from('activity_logs')
        .update({
          category,
          content: content.trim(),
          image_url: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
        })
        .eq('id', post.id)

      if (error) throw error

      if (imagesToDelete.length > 0) {
        await deleteMultipleImages(imagesToDelete)
      }

      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      alert('投稿の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>投稿を編集</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリ選択 */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex-1 py-2 px-2 rounded-lg border-2 transition-all whitespace-nowrap ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <span>{cat.icon}</span>
                  <span className="ml-1 text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">内容</Label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              maxLength={1000}
            />
            <div className="text-right text-sm text-muted-foreground">
              {content.length}/1000
            </div>
          </div>

          {/* 既存画像 */}
          {existingImages.length > 0 && (
            <div className="space-y-2">
              <Label>現在の画像</Label>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={img.url}
                      alt={`画像 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新規画像追加 */}
          {remainingSlots > 0 && (
            <div className="space-y-2">
              <Label>画像を追加</Label>
              <ImageUpload
                images={newImages}
                onImagesChange={setNewImages}
                disabled={loading}
              />
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !content.trim() || isCompressing}
            >
              {loading ? (
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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
