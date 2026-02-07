/**
 * URL検出とリンク化のユーティリティ関数
 */

// URL正規表現パターン（多くのURLパターンをカバー）
const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi

/**
 * 安全なURLかどうかを検証
 * http/httpsのみ許可（javascript:など悪意のあるスキームを除外）
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * テキストからURLを抽出
 * 重複を除去して配列で返す
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX) || []
  // 重複を除去
  const uniqueUrls = Array.from(new Set(matches))
  return uniqueUrls.filter(isValidUrl)
}

/**
 * URLを正規化（末尾のスラッシュ統一など）
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    return url
  }
}

/**
 * テキストをURLと通常テキストのパーツに分割
 */
export function splitTextByUrls(text: string): Array<{ type: 'text' | 'link'; content: string }> {
  const urls = extractUrls(text)
  if (urls.length === 0) {
    return [{ type: 'text', content: text }]
  }

  const result: Array<{ type: 'text' | 'link'; content: string }> = []
  let remaining = text

  // URLを見つけた順にテキストを分割
  for (const url of urls) {
    const index = remaining.indexOf(url)
    if (index === -1) continue

    // URL前のテキスト
    if (index > 0) {
      result.push({ type: 'text', content: remaining.slice(0, index) })
    }
    // URL自体
    result.push({ type: 'link', content: url })
    // 残りのテキスト
    remaining = remaining.slice(index + url.length)
  }

  // 最後の残りテキスト
  if (remaining.length > 0) {
    result.push({ type: 'text', content: remaining })
  }

  return result
}

// OGPプレビュー表示のデフォルト最大URL数
export const MAX_OGP_PREVIEWS = 3
