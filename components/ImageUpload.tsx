'use client'

import { useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImageFile } from '@/lib/supabase-storage'
import { MAX_IMAGES_PER_POST, ALLOWED_IMAGE_TYPES } from '@/types/storage'

type ImagePreview = {
  id: string
  file: File
  previewUrl: string
  isCompressing: boolean
  compressedFile?: File
}

type ImageUploadProps = {
  images: ImagePreview[]
  onImagesChange: (images: ImagePreview[]) => void
  disabled?: boolean
}

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

export function ImageUpload({ images, onImagesChange, disabled }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)

    const remainingSlots = MAX_IMAGES_PER_POST - images.length
    if (remainingSlots <= 0) {
      setError(`画像は最大${MAX_IMAGES_PER_POST}枚までです`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const newImages: ImagePreview[] = []

    for (const file of filesToProcess) {
      // バリデーション
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'ファイルが無効です')
        continue
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const previewUrl = URL.createObjectURL(file)

      newImages.push({
        id,
        file,
        previewUrl,
        isCompressing: true,
      })
    }

    if (newImages.length === 0) return

    // プレビューを先に追加
    const updatedImages = [...images, ...newImages]
    onImagesChange(updatedImages)

    // 圧縮処理（並列実行）
    const compressPromises = newImages.map(async (img) => {
      try {
        const compressedFile = await imageCompression(img.file, compressionOptions)
        return { id: img.id, compressedFile, success: true }
      } catch (err) {
        console.error('Compression failed:', err)
        return { id: img.id, compressedFile: img.file, success: false }
      }
    })

    const results = await Promise.all(compressPromises)

    onImagesChange(
      updatedImages.map((img) => {
        const result = results.find((r) => r.id === img.id)
        if (result) {
          return { ...img, isCompressing: false, compressedFile: result.compressedFile }
        }
        return img
      })
    )

    // input をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [images, onImagesChange])

  const handleRemoveImage = useCallback((id: string) => {
    const imageToRemove = images.find((img) => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl)
    }
    onImagesChange(images.filter((img) => img.id !== id))
  }, [images, onImagesChange])

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = images.length < MAX_IMAGES_PER_POST

  return (
    <div className="space-y-3">
      {/* プレビューエリア */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
            >
              <img
                src={img.previewUrl}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              {img.isCompressing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(img.id)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                disabled={disabled}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ファイル選択ボタン */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled}
            className="gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            画像を追加 ({images.length}/{MAX_IMAGES_PER_POST})
          </Button>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export type { ImagePreview }
