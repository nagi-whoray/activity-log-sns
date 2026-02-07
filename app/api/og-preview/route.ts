import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isValidUrl } from '@/lib/url-utils'

export interface OgpData {
  url: string
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  faviconUrl: string | null
  error?: string
}

/**
 * HTMLからOGPメタデータをパース
 */
function parseOgpFromHtml(html: string, baseUrl: string): Partial<OgpData> {
  const result: Partial<OgpData> = {}

  // og:title または <title>
  const titleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i) ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)
  result.title = titleMatch?.[1]?.trim() || null

  // og:description または description
  const descMatch =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i) ||
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  result.description = descMatch?.[1]?.trim() || null

  // og:image
  const imageMatch =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i)
  if (imageMatch?.[1]) {
    try {
      result.imageUrl = new URL(imageMatch[1], baseUrl).href
    } catch {
      result.imageUrl = null
    }
  }

  // og:site_name
  const siteNameMatch = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i
  )
  try {
    result.siteName = siteNameMatch?.[1]?.trim() || new URL(baseUrl).hostname
  } catch {
    result.siteName = null
  }

  // favicon
  const faviconMatch =
    html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i) ||
    html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["']/i)
  if (faviconMatch?.[1]) {
    try {
      result.faviconUrl = new URL(faviconMatch[1], baseUrl).href
    } catch {
      result.faviconUrl = null
    }
  } else {
    try {
      result.faviconUrl = new URL('/favicon.ico', baseUrl).href
    } catch {
      result.faviconUrl = null
    }
  }

  return result
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: '無効なURLです' }, { status: 400 })
    }

    const supabase = await createClient()

    // キャッシュを確認
    const { data: cached } = await supabase
      .from('ogp_cache')
      .select('*')
      .eq('url', url)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) {
      // キャッシュヒット
      if (cached.error_message) {
        return NextResponse.json({
          url: cached.url,
          title: null,
          description: null,
          imageUrl: null,
          siteName: null,
          faviconUrl: null,
          error: cached.error_message,
        })
      }
      return NextResponse.json({
        url: cached.url,
        title: cached.title,
        description: cached.description,
        imageUrl: cached.image_url,
        siteName: cached.site_name,
        faviconUrl: cached.favicon_url,
      })
    }

    // OGPを取得
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒タイムアウト

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ActivityLogSNS/1.0; +https://activity-log-sns.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ja,en;q=0.9',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error('HTML以外のコンテンツタイプです')
      }

      const html = await response.text()
      const ogpData = parseOgpFromHtml(html, url)

      // キャッシュに保存（upsert）
      await supabase.from('ogp_cache').upsert(
        {
          url,
          title: ogpData.title,
          description: ogpData.description,
          image_url: ogpData.imageUrl,
          site_name: ogpData.siteName,
          favicon_url: ogpData.faviconUrl,
          fetched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          error_message: null,
        },
        { onConflict: 'url' }
      )

      return NextResponse.json({
        url,
        title: ogpData.title,
        description: ogpData.description,
        imageUrl: ogpData.imageUrl,
        siteName: ogpData.siteName,
        faviconUrl: ogpData.faviconUrl,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'

      // エラーをキャッシュ（再試行を防ぐため、短い有効期限）
      await supabase.from('ogp_cache').upsert(
        {
          url,
          title: null,
          description: null,
          image_url: null,
          site_name: null,
          favicon_url: null,
          error_message: errorMessage,
          expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1時間
        },
        { onConflict: 'url' }
      )

      let siteName: string | null = null
      try {
        siteName = new URL(url).hostname
      } catch {
        siteName = null
      }

      return NextResponse.json({
        url,
        title: null,
        description: null,
        imageUrl: null,
        siteName,
        faviconUrl: null,
        error: errorMessage,
      })
    }
  } catch (error) {
    console.error('OGP preview error:', error)
    return NextResponse.json({ error: 'OGP取得に失敗しました' }, { status: 500 })
  }
}
