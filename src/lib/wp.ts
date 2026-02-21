export interface WpRendered {
  rendered: string
}

export interface WpTerm {
  id: number
  name: string
  slug: string
  taxonomy: string
}

export interface WpAuthor {
  id: number
  name: string
  slug: string
}

export interface WpFeaturedMedia {
  id: number
  source_url: string
  alt_text?: string
}

export interface WpPost {
  id: number
  date: string
  modified: string
  slug: string
  link: string
  status: string
  type: 'post'
  title: WpRendered
  excerpt: WpRendered
  content: WpRendered & { protected: boolean }
  author: number
  featured_media: number
  categories: number[]
  tags: number[]
  _embedded?: {
    author?: WpAuthor[]
    'wp:featuredmedia'?: WpFeaturedMedia[]
    'wp:term'?: WpTerm[][]
  }
}

export interface WpPage {
  id: number
  date: string
  modified: string
  slug: string
  link: string
  status: string
  type: 'page'
  title: WpRendered
  content: WpRendered & { protected: boolean }
}

export interface WpCategory {
  id: number
  name: string
  slug: string
  count: number
}

export interface WpTag {
  id: number
  name: string
  slug: string
  count: number
}

export interface WpSiteContent {
  posts: WpPost[]
  pages: WpPage[]
  categories: WpCategory[]
  tags: WpTag[]
}

const API_BASE =
  process.env.NEXT_PUBLIC_WP_API_BASE_URL?.replace(/\/$/, '') ??
  process.env.VITE_WP_API_BASE_URL?.replace(/\/$/, '') ??
  'https://ukrfish.org/wp-json'

const REST_BASE = `${API_BASE}/wp/v2`

async function requestJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`WordPress request failed (${response.status})`)
  }

  const data = (await response.json()) as T
  const totalPages = Number.parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10)
  return { data, totalPages: Number.isNaN(totalPages) ? 1 : totalPages }
}

async function fetchAll<T>(urlFactory: (page: number) => string): Promise<T[]> {
  const first = await requestJson<T[]>(urlFactory(1))
  if (first.totalPages <= 1) {
    return first.data
  }

  const remainingPages = Array.from({ length: first.totalPages - 1 }, (_, index) => index + 2)
  const remaining = await Promise.all(remainingPages.map((page) => requestJson<T[]>(urlFactory(page))))
  return first.data.concat(remaining.flatMap((page) => page.data))
}

export async function fetchWpPosts(): Promise<WpPost[]> {
  const posts = await fetchAll<WpPost>(
    (page) =>
      `${REST_BASE}/posts?status=publish&orderby=date&order=desc&page=${page}&per_page=100&_embed=1`,
  )
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function fetchWpPages(): Promise<WpPage[]> {
  const pages = await fetchAll<WpPage>(
    (page) => `${REST_BASE}/pages?status=publish&orderby=menu_order&order=asc&page=${page}&per_page=100`,
  )
  return pages.sort((a, b) => a.title.rendered.localeCompare(b.title.rendered))
}

export async function fetchWpCategories(): Promise<WpCategory[]> {
  const categories = await fetchAll<WpCategory>(
    (page) => `${REST_BASE}/categories?hide_empty=false&orderby=count&order=desc&page=${page}&per_page=100`,
  )
  return categories.sort((a, b) => b.count - a.count)
}

export async function fetchWpTags(): Promise<WpTag[]> {
  const tags = await fetchAll<WpTag>(
    (page) => `${REST_BASE}/tags?hide_empty=false&orderby=count&order=desc&page=${page}&per_page=100`,
  )
  return tags.sort((a, b) => b.count - a.count)
}

export async function fetchWpPostBySlug(slug: string): Promise<WpPost | null> {
  const { data } = await requestJson<WpPost[]>(
    `${REST_BASE}/posts?status=publish&slug=${encodeURIComponent(slug)}&_embed=1`,
  )
  return data[0] ?? null
}

export async function fetchWpPostById(id: number): Promise<WpPost | null> {
  try {
    const { data } = await requestJson<WpPost>(`${REST_BASE}/posts/${id}?context=view&_embed=1`)
    return data.status === 'publish' ? data : null
  } catch {
    return null
  }
}

export async function fetchWpSiteContent(): Promise<WpSiteContent> {
  const [posts, pages, categories, tags] = await Promise.all([
    fetchWpPosts(),
    fetchWpPages(),
    fetchWpCategories(),
    fetchWpTags(),
  ])

  return { posts, pages, categories, tags }
}
