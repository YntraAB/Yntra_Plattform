import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { getCroppedImg } from '@/lib/image-utils'
import type { PixelCrop } from '@/lib/image-utils'
import { useTranslation } from 'react-i18next'

interface ImageCropperDialogProps {
  image: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedImage: Blob) => void
  aspect?: number
}

export const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({
  image,
  open,
  onClose,
  onCropComplete,
  aspect = 1,
}) => {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onCropCompleteInternal = useCallback((_croppedArea: unknown, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      if (croppedImage) {
        onCropComplete(croppedImage)
        onClose()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border/50 bg-background/95 backdrop-blur-md sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('settings.workspace.crop_logo', 'Crop Organization Logo')}</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4 h-[300px] w-full overflow-hidden rounded-lg bg-black/10">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={([val]) => setZoom(val)}
          />
        </div>

        <DialogFooter className="mt-8 gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
