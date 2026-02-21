function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

export function decodeHtml(html: string): string {
  return parseHtml(html).documentElement.textContent?.trim() ?? ''
}

export function stripHtml(html: string): string {
  return parseHtml(html).body.textContent?.trim() ?? ''
}

export function estimateReadTimeMinutes(contentHtml: string, wordsPerMinute = 200): number {
  const words = stripHtml(contentHtml)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  return Math.max(1, Math.ceil(words.length / wordsPerMinute))
}

export function formatUaDate(dateIso: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateIso))
}
