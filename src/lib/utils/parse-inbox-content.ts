// Inbox入力内容の解析ユーティリティ

export interface ParsedInboxContent {
  title: string
  urls: string[]
  memo: string
}

/**
 * Inbox入力内容を解析してタイトル、URL、メモに分解
 *
 * 対応パターン:
 * - URLのみ: "https://youtube.com/watch?v=abc" → title=URL, urls=[URL]
 * - タイトル + URL: "動画 https://youtube.com/..." → title="動画", urls=[URL]
 * - 複数URL: "記事\nhttps://...\nhttps://..." → title="記事", urls=[URL1, URL2]
 * - テキストのみ: "メモ内容" → title="メモ内容", urls=[]
 */
export function parseInboxContent(content: string): ParsedInboxContent {
  if (!content || !content.trim()) {
    return { title: '', urls: [], memo: '' }
  }

  // URL正規表現（http/https）
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = content.match(urlRegex) || []

  // URLを除いたテキスト
  let remainingText = content.replace(urlRegex, '').trim()

  // 改行を整理
  remainingText = remainingText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')

  // タイトルとメモを分割（最初の行をタイトル、残りをメモ）
  const lines = remainingText.split('\n')
  const title = lines[0] || (urls.length > 0 ? urls[0] : '') || ''
  const memo = lines.slice(1).join('\n')

  return {
    title: title,
    urls: [...new Set(urls)], // 重複削除
    memo: memo
  }
}

/**
 * URLからドメイン名を抽出（表示用）
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * YouTube URLかどうかを判定
 */
export function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}

/**
 * YouTube URLからサムネイルURLを取得
 */
export function getYouTubeThumbnail(url: string): string | null {
  try {
    const urlObj = new URL(url)
    let videoId: string | null = null

    // youtube.com/watch?v=... 形式
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v')
    }
    // youtu.be/... 形式
    else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.slice(1)
    }

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  } catch {
    return null
  }
  return null
}

/**
 * URLのファビコンを取得（表示用）
 */
export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
  } catch {
    return ''
  }
}
