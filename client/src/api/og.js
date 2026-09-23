// Vercel Serverless Function — runs at https://your-site.vercel.app/api/og
// Serves /c/:slug with company-specific Open Graph tags for social scrapers.

const PROJECT_ID = 'skillnest-mvp-b4bef'
const FIREBASE_API_KEY = 'AIzaSyDZzU2vdIxnmvIzKKRoKIZmeXB3xYCQkNm8'
const DEFAULT_IMAGE = '/logo.png'

/** Escape user content so it can't break out of an HTML attribute. */
function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Look up a company by slug via the Firestore REST API. */
async function fetchCompany(slug) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'companies' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'slug' },
            op: 'EQUAL',
            value: { stringValue: slug },
          },
        },
        limit: 1,
      },
    }),
  })

  if (!res.ok) {
    console.warn('[og] Firestore HTTP', res.status)
    return null
  }
  const data = await res.json()
  const doc = Array.isArray(data) ? data[0]?.document : null
  if (!doc) return null

  const f = doc.fields || {}
  return {
    name: f.name?.stringValue || '',
    tagline: f.tagline?.stringValue || '',
    description: f.description?.stringValue || '',
    logoUrl: f.logoUrl?.stringValue || '',
    coverUrl: f.coverUrl?.stringValue || '',
    industry: f.industry?.stringValue || '',
    location: f.location?.stringValue || '',
  }
}

/** Strip newlines and cap length for meta descriptions. */
function summarise(text, max = 160) {
  if (!text) return ''
  const clean = String(text).replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

/**
 * Minimal HTML shell — used as fallback if fetching /index.html fails.
 * The script tag boots the SPA once deployed.
 */
function fallbackHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SkillNest</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SkillNest" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body><div id="root"></div></body>
</html>`
}

export default async function handler(req, res) {
  const slug = (req.query?.slug || '').toString().trim()

  // --- Fetch the built SPA index.html from this same origin ---
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host

  let html = fallbackHtml()
  try {
    const indexRes = await fetch(`${proto}://${host}/index.html`, {
      // Prevent the rewrite from catching this internal fetch
      headers: { 'x-internal': 'og' },
    })
    if (indexRes.ok) {
      const fetched = await indexRes.text()
      // Sanity check — only use it if it looks like our SPA shell
      if (fetched && fetched.includes('<div id="root"')) {
        html = fetched
      }
    } else {
      console.warn('[og] Could not fetch index.html:', indexRes.status)
    }
  } catch (err) {
    console.warn('[og] Fetch index.html failed:', err?.message)
  }

  // --- No slug: return the plain SPA shell ---
  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  }

  // --- Look up company ---
  let company = null
  try {
    company = await fetchCompany(slug)
  } catch (err) {
    console.warn('[og] Firestore lookup failed for', slug, err?.message)
  }

  // --- Inject company OG tags ---
  if (company) {
    const name = company.name || 'Company'
    const title = `${name} — SkillNest`
    const tagline =
      company.tagline ||
      company.description ||
      `${company.industry || 'A company'} hiring on SkillNest.`
    const description = summarise(tagline, 160)

    const origin = `${proto}://${host}`
    const pageUrl = `${origin}/c/${slug}`

    let image = company.coverUrl || company.logoUrl || `${origin}${DEFAULT_IMAGE}`
    if (image.startsWith('/')) image = origin + image

    // Only replace tags that already exist in the shell (created by Vite plugin)
    // If they don't exist, append them before </head>.
    const ogTags = `
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:secure_url" content="${esc(image)}" />
    <meta property="og:image:alt" content="${esc(name)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <link rel="canonical" href="${esc(pageUrl)}" />`

    if (/<meta property="og:title"[^>]*>/.test(html)) {
      // Replace existing tags
      html = html
        .replace(
          /<meta property="og:title"[^>]*>/,
          `<meta property="og:title" content="${esc(title)}" />`
        )
        .replace(
          /<meta property="og:description"[^>]*>/,
          `<meta property="og:description" content="${esc(description)}" />`
        )
        .replace(
          /<meta property="og:image"[^>]*>/,
          `<meta property="og:image" content="${esc(image)}" />`
        )
        .replace(
          /<meta property="og:url"[^>]*>/,
          `<meta property="og:url" content="${esc(pageUrl)}" />`
        )
        .replace(
          /<meta name="twitter:title"[^>]*>/,
          `<meta name="twitter:title" content="${esc(title)}" />`
        )
        .replace(
          /<meta name="twitter:description"[^>]*>/,
          `<meta name="twitter:description" content="${esc(description)}" />`
        )
        .replace(
          /<meta name="twitter:image"[^>]*>/,
          `<meta name="twitter:image" content="${esc(image)}" />`
        )
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    } else {
      // No tags present — inject the whole block before </head>
      html = html.replace('</head>', `${ogTags}\n</head>`)
    }

    // Cache on the edge for a few minutes to reduce Firestore reads
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600')
  } else {
    // Company not found — fallback tags, short cache
    res.setHeader('Cache-Control', 'public, max-age=60')
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}