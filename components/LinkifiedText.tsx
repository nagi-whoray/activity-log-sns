'use client'

import { useMemo } from 'react'
import { splitTextByUrls } from '@/lib/url-utils'

interface LinkifiedTextProps {
  text: string
  className?: string
}

/**
 * テキスト内のURLを自動検出してクリック可能なリンクに変換するコンポーネント
 */
export function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const parts = useMemo(() => splitTextByUrls(text), [text])

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <a
            key={index}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part.content}
          </a>
        ) : (
          <span key={index}>{part.content}</span>
        )
      )}
    </span>
  )
}
