'use client'

import { useMemo } from 'react'
import { OgpPreviewCard } from '@/components/OgpPreviewCard'
import { extractUrls, MAX_OGP_PREVIEWS } from '@/lib/url-utils'

interface OgpPreviewListProps {
  content: string
  maxPreviews?: number
}

/**
 * テキスト内のURLを検出してOGPプレビューカードのリストを表示するコンポーネント
 * @param content - URLを含むテキスト
 * @param maxPreviews - 表示する最大プレビュー数（デフォルト: 3）
 */
export function OgpPreviewList({ content, maxPreviews = MAX_OGP_PREVIEWS }: OgpPreviewListProps) {
  const urls = useMemo(() => {
    const extracted = extractUrls(content)
    return extracted.slice(0, maxPreviews)
  }, [content, maxPreviews])

  if (urls.length === 0) return null

  return (
    <div className="space-y-2 mt-2">
      {urls.map((url) => (
        <OgpPreviewCard key={url} url={url} />
      ))}
    </div>
  )
}
