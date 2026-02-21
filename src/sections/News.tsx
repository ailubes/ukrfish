import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  Search,
  Tag,
  User,
} from 'lucide-react'
import mermaid from 'mermaid'
import { fetchWpCategories, fetchWpPosts, type WpCategory, type WpPost } from '../lib/wp'
import { decodeHtml, estimateReadTimeMinutes, formatUaDate, stripHtml } from '../lib/wp-content'

interface NewsProps {
  activeSlug: string | null
  onOpenPost: (slug: string) => void
  onClosePost: () => void
  isResolvingLegacyPost: boolean
}

interface NewsCardProps {
  post: NewsPostModel
  featured?: boolean
  onOpenPost: (slug: string) => void
}

interface NewsPostModel {
  id: number
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  category: string
  categories: string[]
  author: string
  date: string
  readTime: string
  imageUrl: string | null
  imageAlt: string
  link: string
}

interface NewsCategoryFilter {
  name: string
  label: string
  count: number
}

function parseFencedMermaid(content: string): string | null {
  const match = content.match(/```mermaid\s*([\s\S]*?)```/i)
  return match?.[1]?.trim() || null
}

function extractMermaidDefinition(primaryElement: HTMLElement, fallbackElement?: HTMLElement | null): string | null {
  const candidates = [primaryElement, fallbackElement].filter(Boolean) as HTMLElement[]

  for (const candidate of candidates) {
    const rawContent = candidate.textContent?.trim() || ''
    if (!rawContent) {
      continue
    }

    const metadata = [
      candidate.className,
      candidate.getAttribute('data-language') ?? '',
      candidate.getAttribute('lang') ?? '',
    ]
      .join(' ')
      .toLowerCase()

    if (metadata.includes('mermaid')) {
      const fenced = parseFencedMermaid(rawContent)
      return (fenced ?? rawContent).replace(/\u00a0/g, ' ').trim()
    }

    const fenced = parseFencedMermaid(rawContent)
    if (fenced) {
      return fenced.replace(/\u00a0/g, ' ').trim()
    }
  }

  return null
}

function NewsArticleContent({ html, articleId }: { html: string; articleId: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let isCancelled = false

    void (async () => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
      })

      const preElements = Array.from(container.querySelectorAll('pre'))
      const divElements = Array.from(container.querySelectorAll('div.mermaid'))
      const targets = [...preElements, ...divElements]
      let renderIndex = 0

      for (const target of targets) {
        if (isCancelled || !(target instanceof HTMLElement)) {
          return
        }

        const nestedCode = target.querySelector('code')
        const sourceElement =
          nestedCode instanceof HTMLElement ? nestedCode : target

        const mermaidDefinition = extractMermaidDefinition(sourceElement, target)
        if (!mermaidDefinition) {
          continue
        }

        const diagramHost = document.createElement('div')
        diagramHost.className = 'mermaid-diagram'

        try {
          const { svg } = await mermaid.render(
            `news-mermaid-${articleId}-${renderIndex++}`,
            mermaidDefinition,
          )
          diagramHost.innerHTML = svg
          target.replaceWith(diagramHost)
        } catch {
          // Keep a visible fallback when Mermaid parsing fails.
          diagramHost.innerHTML = '<p class="text-sm text-red-600">Не вдалося відобразити Mermaid-діаграму.</p>'
          target.replaceWith(diagramHost)
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [articleId, html])

  return <div ref={containerRef} className="wp-content" dangerouslySetInnerHTML={{ __html: html }} />
}

function getCategoryNames(post: WpPost, categoryLookup: Map<number, WpCategory>): string[] {
  const primary = (post.categories ?? [])
    .map((categoryId) => categoryLookup.get(categoryId)?.name)
    .filter((name): name is string => Boolean(name))

  if (primary.length > 0) {
    return primary
  }

  const embeddedTerms = post._embedded?.['wp:term'] ?? []
  const fallback = embeddedTerms
    .flat()
    .filter((term) => term.taxonomy === 'category')
    .map((term) => term.name)

  return fallback.length > 0 ? fallback : ['Без категорії']
}

function toNewsPostModel(post: WpPost, categoryLookup: Map<number, WpCategory>): NewsPostModel {
  const categories = getCategoryNames(post, categoryLookup)
  const title = decodeHtml(post.title.rendered)
  const excerpt = stripHtml(post.excerpt.rendered) || `${stripHtml(post.content.rendered).slice(0, 240)}...`
  const author = post._embedded?.author?.[0]?.name ?? 'UKRFISH'
  const media = post._embedded?.['wp:featuredmedia']?.[0]

  return {
    id: post.id,
    slug: post.slug,
    title,
    excerpt,
    contentHtml: post.content.rendered,
    category: categories[0],
    categories,
    author,
    date: formatUaDate(post.date),
    readTime: `${estimateReadTimeMinutes(post.content.rendered)} хв`,
    imageUrl: media?.source_url ?? null,
    imageAlt: media?.alt_text || title,
    link: post.link,
  }
}

function NewsCard({ post, featured = false, onOpenPost }: NewsCardProps) {
  return (
    <article
      className={`blueprint-panel group cursor-pointer hover:-translate-y-2 transition-all duration-500 ${
        featured ? 'border-2 border-[#facc15]' : ''
      }`}
      onClick={() => onOpenPost(post.slug)}
    >
      {post.imageUrl && (
        <div className="mb-4 overflow-hidden border border-[#0047AB]/10 bg-gray-100">
          <img
            src={post.imageUrl}
            alt={post.imageAlt}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              featured ? 'h-64' : 'h-48'
            }`}
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <span
          className={`px-3 py-1 text-xs font-mono ${
            featured
              ? 'bg-[#facc15] text-[#002d6e]'
              : 'bg-gradient-to-r from-[#0047AB] to-[#002d6e] text-white'
          }`}
        >
          {post.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {post.readTime}
        </span>
      </div>

      <h4
        className={`font-semibold mb-3 group-hover:text-[#0047AB] transition-colors line-clamp-3 ${
          featured ? 'text-xl' : 'text-lg'
        }`}
      >
        {post.title}
      </h4>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{post.excerpt}</p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.date}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-[#0047AB] hover:text-[#facc15] transition-colors group/btn"
        >
          Читати
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  )
}

function NewsArticle({
  post,
  onClosePost,
}: {
  post: NewsPostModel
  onClosePost: () => void
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={onClosePost}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#0047AB]/30 text-[#0047AB] hover:bg-[#0047AB] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          До всіх новин
        </button>
      </div>

      <header className="section-header">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.categories.map((category) => (
            <span key={category} className="px-3 py-1 text-xs font-mono bg-[#0047AB] text-white">
              {category}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
        <h2 className="text-2xl lg:text-4xl font-semibold text-[#1a1a1a] leading-tight">{post.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.date}
          </span>
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#0047AB] hover:text-[#facc15]"
          >
            Оригінал
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {post.imageUrl && (
        <div className="blueprint-panel mb-8 p-0 overflow-hidden">
          <img src={post.imageUrl} alt={post.imageAlt} className="w-full h-auto" />
        </div>
      )}

      <article className="blueprint-panel">
        <NewsArticleContent html={post.contentHtml} articleId={post.id} />
      </article>
    </div>
  )
}

export default function News({ activeSlug, onOpenPost, onClosePost, isResolvingLegacyPost }: NewsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [posts, setPosts] = useState<NewsPostModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    void Promise.all([fetchWpPosts(), fetchWpCategories()])
      .then(([wpPosts, wpCategories]) => {
        if (isCancelled) {
          return
        }

        const categoryLookup = new Map<number, WpCategory>(
          wpCategories.map((category) => [category.id, category]),
        )

        const mapped = wpPosts.map((post) => toNewsPostModel(post, categoryLookup))
        setPosts(mapped)
      })
      .catch(() => {
        if (isCancelled) {
          return
        }
        setError('Не вдалося завантажити новини з WordPress.')
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const categories = useMemo<NewsCategoryFilter[]>(() => {
    const counts = new Map<string, number>()

    posts.forEach((post) => {
      post.categories.forEach((category) => {
        counts.set(category, (counts.get(category) ?? 0) + 1)
      })
    })

    const dynamicCategories = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        name: label,
        label,
        count,
      }))

    return [{ name: 'all', label: 'Всі', count: posts.length }, ...dynamicCategories]
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || post.categories.includes(selectedCategory)
      return matchesSearch && matchesCategory
    })
  }, [posts, searchQuery, selectedCategory])

  const featuredPost = filteredPosts[0] ?? null
  const showFeatured = searchQuery.length === 0 && selectedCategory === 'all' && featuredPost !== null
  const regularPosts = showFeatured ? filteredPosts.slice(1) : filteredPosts
  const activePost = activeSlug ? posts.find((post) => post.slug === activeSlug) ?? null : null

  if (isResolvingLegacyPost) {
    return (
      <div className="p-6 lg:p-8">
        <div className="blueprint-panel text-center py-16">
          <p className="text-gray-600">Шукаємо публікацію за старим посиланням...</p>
        </div>
      </div>
    )
  }

  if (activeSlug && isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="blueprint-panel text-center py-16">
          <p className="text-gray-600">Завантаження статті...</p>
        </div>
      </div>
    )
  }

  if (activeSlug && activePost) {
    return <NewsArticle post={activePost} onClosePost={onClosePost} />
  }

  if (activeSlug && !isLoading && !activePost) {
    return (
      <div className="p-6 lg:p-8">
        <div className="blueprint-panel text-center py-16">
          <AlertTriangle className="w-8 h-8 text-[#facc15] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Публікацію не знайдено</h3>
          <p className="text-gray-600 mb-6">Можливо, матеріал був видалений або URL застарів.</p>
          <button type="button" onClick={onClosePost} className="btn-primary">
            Перейти до новин
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Останні події</h2>
        <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">Новини та публікації</h3>
      </header>

      <div className="blueprint-panel mb-8">
        <p className="text-gray-700 leading-relaxed">
          Усі новини автоматично завантажуються з WordPress. Тут доступні публікації, категорії та повні
          тексти статей із можливістю читання в детальному режимі.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0047AB]" />
          <input
            type="text"
            placeholder="Пошук по новинах..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-[#0047AB]/20 focus:border-[#0047AB] transition-colors outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <Filter className="w-5 h-5 text-[#0047AB] flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-all ${
                selectedCategory === category.name
                  ? 'bg-[#0047AB] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs opacity-60">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="blueprint-panel mb-8 border-2 border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="blueprint-panel text-center py-16 mb-8">
          <p className="text-gray-600">Завантаження новин...</p>
        </div>
      )}

      {!isLoading && showFeatured && featuredPost && (
        <div className="mb-8">
          <div className="panel-title mb-4">
            <span>ГОЛОВНА НОВИНА</span>
          </div>
          <NewsCard post={featuredPost} featured onOpenPost={onOpenPost} />
        </div>
      )}

      {!isLoading && (
        <div className="mb-8">
          <div className="panel-title mb-4">
            <span>ОСТАННІ ПУБЛІКАЦІЇ</span>
            <span className="text-xs opacity-60">{regularPosts.length} матеріалів</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {regularPosts.map((post) => (
              <NewsCard key={post.id} post={post} onOpenPost={onOpenPost} />
            ))}
          </div>
          {regularPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Новини не знайдено</p>
            </div>
          )}
        </div>
      )}

      <div className="blueprint-panel">
        <div className="panel-title mb-6">
          <span>КАТЕГОРІЇ</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories
            .filter((category) => category.name !== 'all')
            .map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => setSelectedCategory(category.name)}
                className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 hover:border-[#0047AB] hover:bg-white transition-all"
              >
                <span className="text-gray-700">{category.label}</span>
                <span className="block font-mono text-xs text-gray-400 mt-1">{category.count}</span>
              </button>
            ))}
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© {new Date().getFullYear()} Громадська спілка "Риба України"</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-[#facc15]" />
            {posts.length} публікацій з WordPress
          </span>
        </div>
      </footer>
    </div>
  )
}
