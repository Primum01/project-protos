import { useEffect } from 'react'

interface PageMetaOptions {
  title: string
  description: string
  /** Canonical path, e.g. "/pricing". Defaults to window.location.pathname */
  path?: string
  /** Open Graph image URL. Defaults to the site OG image */
  ogImage?: string
  /** Prevent search engines from indexing this page */
  noIndex?: boolean
}

const SITE_NAME = 'TwinSpace'
const SITE_URL = 'https://www.twinspace360.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

/**
 * Sets the document <title>, meta description, canonical link, and Open Graph
 * tags for the current page. Call at the top of every marketing page.
 */
export function usePageMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetaOptions) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────────
    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    // ── Helper to upsert a <meta> tag ──────────────────────────────────────
    function setMeta(selector: string, content: string) {
      let el = document.querySelector<HTMLMetaElement>(selector)
      if (!el) {
        el = document.createElement('meta')
        // Extract the attribute name + value from the selector, e.g. [name="description"]
        const match = selector.match(/\[(\w+)="([^"]+)"\]/)
        if (match) el.setAttribute(match[1], match[2])
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // ── Helper to upsert a <link> tag ──────────────────────────────────────
    function setLink(rel: string, href: string) {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
      if (!el) {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', href)
    }

    const canonicalPath = path ?? window.location.pathname
    const canonicalUrl = `${SITE_URL}${canonicalPath}`

    // ── Standard meta ──────────────────────────────────────────────────────
    setMeta('[name="description"]', description)
    if (noIndex) {
      setMeta('[name="robots"]', 'noindex, nofollow')
    } else {
      setMeta('[name="robots"]', 'index, follow')
    }
    setLink('canonical', canonicalUrl)

    // ── Open Graph ─────────────────────────────────────────────────────────
    setMeta('[property="og:title"]', fullTitle)
    setMeta('[property="og:description"]', description)
    setMeta('[property="og:url"]', canonicalUrl)
    setMeta('[property="og:image"]', ogImage)
    setMeta('[property="og:type"]', 'website')
    setMeta('[property="og:site_name"]', SITE_NAME)

    // ── Twitter Card ───────────────────────────────────────────────────────
    setMeta('[name="twitter:card"]', 'summary_large_image')
    setMeta('[name="twitter:title"]', fullTitle)
    setMeta('[name="twitter:description"]', description)
    setMeta('[name="twitter:image"]', ogImage)
  }, [title, description, path, ogImage, noIndex])
}
