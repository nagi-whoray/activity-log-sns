import { Area } from 'react-easy-crop'

/**
 * 画像を読み込んでHTMLImageElementを返す
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

/**
 * react-easy-crop のクロップ領域を使って画像を切り抜き、Fileとして返す
 */
export async function getCroppedImageFile(
  imageSrc: string,
  cropArea: Area,
  fileName: string = 'cropped.jpg'
): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context を取得できませんでした')
  }

  canvas.width = cropArea.width
  canvas.height = cropArea.height

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('画像の切り抜きに失敗しました'))
          return
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        resolve(file)
      },
      'image/jpeg',
      0.95
    )
  })
}
