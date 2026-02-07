'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import type { OgpData } from '@/app/api/og-preview/route'

interface OgpPreviewCardProps {
  url: string
}

/**
 * URLのOGPメタデータを取得してプレビューカードを表示するコンポーネント
 */
export function OgpPreviewCard({ url }: OgpPreviewCardProps) {
  const [ogp, setOgp] = useState<OgpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchOgp = async () => {
      try {
        const response = await fetch('/api/og-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) throw new Error('Failed to fetch OGP')

        const data = await response.json()
        setOgp(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOgp()
  }, [url])

  // ローディング状態
  if (loading) {
    return (
      <Card className="p-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-200 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    )
  }

  // エラー時はシンプルなリンクを表示
  if (error || !ogp) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">🔗</span>
          <span className="truncate">{url}</span>
        </div>
      </a>
    )
  }

  // OGPにエラーがある場合もシンプルなリンクを表示
  if (ogp.error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">🔗</span>
          <span className="truncate">{ogp.siteName || url}</span>
        </div>
      </a>
    )
  }

  const displayTitle = ogp.title || ogp.siteName || new URL(url).hostname
  const displayDescription = ogp.description?.slice(0, 120) || ''

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {/* 画像 */}
          {ogp.imageUrl && !imageError ? (
            <div className="relative w-28 h-28 shrink-0 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogp.imageUrl}
                alt={displayTitle}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-28 h-28 shrink-0 bg-gray-100 flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
          )}

          {/* コンテンツ */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              {ogp.faviconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ogp.faviconUrl}
                  alt=""
                  width={14}
                  height={14}
                  className="rounded-sm"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <span className="text-xs text-gray-500 truncate">
                {ogp.siteName || new URL(url).hostname}
              </span>
            </div>
            <h4 className="font-medium text-sm line-clamp-2 text-gray-900">{displayTitle}</h4>
            {displayDescription && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{displayDescription}</p>
            )}
          </div>
        </div>
      </Card>
    </a>
  )
}
