// Vercel Serverless Function — runs at https://your-site.vercel.app/api/og
// Serves /c/:slug with company-specific Open Graph tags for social scrapers.

const PROJECT_ID = 'skillnest-mvp-b4bef'
const FIREBASE_API_KEY = 'AIzaSyDZzU2vdIxnmvIzKKRoKIZmeXB3xYCQkNm8'
const DEFAULT_IMAGE = '/logo.png'

/** Escape user content so it can't break out of an HTML attribute. */
function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Look up a company by slug via the Firestore REST API. */
async function fetchCompany(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`

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

  if (!res.ok) return null
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
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

export default async function handler(req, res) {
  const slug = (req.query.slug || '').toString().trim()

  // Fetch the built index.html from this same origin
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host
  const indexRes = await fetch(`${proto}://${host}/index.html`)
  let html = await indexRes.text()

  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  }

  let company = null
  try {
    company = await fetchCompany(slug)
  } catch (err) {
    console.warn('OG lookup failed for', slug, err.message)
  }

  if (company) {
    const name = company.name || 'Company'
    const title = `${name} — SkillNest`
    const tagline =
      company.tagline ||
      company.description ||
      `${company.industry || 'A company'} hiring on SkillNest.`
    const description = summarise(tagline, 160)

    const origin = `${proto}://${host}`
    let image = company.coverUrl || company.logoUrl || `${origin}${DEFAULT_IMAGE}`
    if (image.startsWith('/')) image = origin + image

    // Swap the OG and Twitter meta tags
    html = html
      .replace(
        /<meta property="og:title"[^>]*>/,
        `<meta property="og:title" content="${esc(title)}">`
      )
      .replace(
        /<meta property="og:description"[^>]*>/,
        `<meta property="og:description" content="${esc(description)}">`
      )
      .replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${esc(image)}">`
      )
      .replace(
        /<meta property="og:image:secure_url"[^>]*>/,
        `<meta property="og:image:secure_url" content="${esc(image)}">`
      )
      .replace(
        /<meta property="og:image:alt"[^>]*>/,
        `<meta property="og:image:alt" content="${esc(name)}">`
      )
      .replace(
        /<meta name="twitter:title"[^>]*>/,
        `<meta name="twitter:title" content="${esc(title)}">`
      )
      .replace(
        /<meta name="twitter:description"[^>]*>/,
        `<meta name="twitter:description" content="${esc(description)}">`
      )
      .replace(
        /<meta name="twitter:image"[^>]*>/,
        `<meta name="twitter:image" content="${esc(image)}">`
      )
      .replace(
        /<title>[^<]*<\/title>/,
        `<title>${esc(title)}</title>`
      )

    // Cache on the edge for a few minutes to reduce Firestore reads
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600')
  } else {
    // Company not found — fall back to default tags, no cache
    res.setHeader('Cache-Control', 'public, max-age=60')
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(html)
}