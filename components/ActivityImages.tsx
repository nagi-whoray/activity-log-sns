'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type ActivityImagesProps = {
  imageUrl: string | null
}

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return []

  try {
    const parsed = JSON.parse(imageUrl)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [imageUrl]
  } catch {
    // JSON でない場合は単一のURLとして扱う
    return imageUrl ? [imageUrl] : []
  }
}

export function ActivityImages({ imageUrl }: ActivityImagesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const imageUrls = parseImageUrls(imageUrl)

  if (imageUrls.length === 0) return null

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
  }

  const openModal = (index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      {/* サムネイル表示 */}
      <div
        className={`grid gap-2 ${
          imageUrls.length === 1
            ? 'grid-cols-1'
            : imageUrls.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-3'
        }`}
      >
        {imageUrls.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openModal(index)}
            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
          >
            <Image
              src={url}
              alt={`画像 ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* 拡大モーダル */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {/* 閉じるボタン */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* 前へボタン */}
            {imageUrls.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            {/* 画像 */}
            <div className="relative w-full h-full">
              <Image
                src={imageUrls[currentIndex]}
                alt={`画像 ${currentIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* 次へボタン */}
            {imageUrls.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}

            {/* インジケーター */}
            {imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
