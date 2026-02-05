'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { getCroppedImageFile } from '@/lib/crop-image'
import { Loader2 } from 'lucide-react'

interface ImageCropDialogProps {
  open: boolean
  imageSrc: string
  aspect: number
  title: string
  onClose: () => void
  onCropComplete: (file: File) => void
}

export function ImageCropDialog({
  open,
  imageSrc,
  aspect,
  title,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels)
      onCropComplete(file)
    } catch (err) {
      console.error('Crop failed:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            ドラッグで位置を調整、スライダーでズームできます
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-sm text-muted-foreground shrink-0">ズーム</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            キャンセル
          </Button>
          <Button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                処理中...
              </>
            ) : (
              '適用'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
