import { createClient } from './supabase/client'
import {
  ImageUploadResult,
  ImageValidationResult,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  STORAGE_BUCKET,
  AllowedImageType,
} from '@/types/storage'

/**
 * ファイルのバリデーション
 */
export function validateImageFile(file: File): ImageValidationResult {
  // ファイルタイプのチェック
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return {
      valid: false,
      error: '対応している画像形式: JPEG, PNG, GIF, WebP',
    }
  }

  // ファイルサイズのチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ファイルサイズは${MAX_FILE_SIZE / 1024 / 1024}MB以下にしてください`,
    }
  }

  return { valid: true }
}

/**
 * 一意のファイルパスを生成
 */
function generateFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = fileName.split('.').pop() || 'jpg'
  return `${userId}/${timestamp}-${randomString}.${extension}`
}

/**
 * 画像をSupabase Storageにアップロード
 */
export async function uploadActivityImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  const supabase = createClient()

  // バリデーション
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // ファイルパス生成
  const filePath = generateFilePath(userId, file.name)

  // アップロード
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`アップロードに失敗しました: ${error.message}`)
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

/**
 * 画像をSupabase Storageから削除
 */
export async function deleteActivityImage(path: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) {
    throw new Error(`画像の削除に失敗しました: ${error.message}`)
  }
}

/**
 * 複数の画像を一括アップロード
 */
export async function uploadMultipleImages(
  files: File[],
  userId: string
): Promise<ImageUploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadActivityImage(file, userId))
  )
  return results
}

/**
 * 複数の画像を一括削除
 */
export async function deleteMultipleImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = createClient()

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths)

  if (error) {
    throw new Error(`画像の削除に失敗しました: ${error.message}`)
  }
}
