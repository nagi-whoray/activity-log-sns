// 画像アップロード関連の型定義

export type ImageUploadResult = {
  url: string
  path: string
}

export type ImageUploadError = {
  message: string
  code?: string
}

export type UploadProgress = {
  loaded: number
  total: number
  percentage: number
}

export type ImageValidationResult = {
  valid: boolean
  error?: string
}

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export const ALLOWED_IMAGE_TYPES: AllowedImageType[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_IMAGES_PER_POST = 5

export const STORAGE_BUCKET = 'activity-images'
