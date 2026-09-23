// DEBUG VERSION — tells us exactly what's happening
export default async function handler(req, res) {
  const slug = (req.query?.slug || '').toString().trim()
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host

  const lines = []
  lines.push(`<h1>🔧 OG Function Debug</h1>`)
  lines.push(`<p><strong>Slug:</strong> ${slug || '(none)'}</p>`)
  lines.push(`<p><strong>Host:</strong> ${host}</p>`)
  lines.push(`<p><strong>Proto:</strong> ${proto}</p>`)
  lines.push(`<p><strong>Node cwd:</strong> ${process.cwd()}</p>`)

  // Try fetching index.html
  try {
    const url = `${proto}://${host}/index.html`
    lines.push(`<p>Trying to fetch: <code>${url}</code></p>`)
    const r = await fetch(url)
    lines.push(`<p><strong>Status:</strong> ${r.status}</p>`)
    lines.push(`<p><strong>Content-Type:</strong> ${r.headers.get('content-type')}</p>`)

    const html = await r.text()
    lines.push(`<p><strong>Length:</strong> ${html.length} chars</p>`)
    lines.push(`<p><strong>Has #root:</strong> ${html.includes('id="root"')}</p>`)
    lines.push(`<p><strong>Has script tag:</strong> ${/<script/.test(html)}</p>`)

    // Show the first 500 chars of what came back
    lines.push(`<h3>First 500 chars:</h3>`)
    lines.push(`<pre style="background:#eee;padding:10px;white-space:pre-wrap;font-size:12px;">${html.slice(0, 500).replace(/</g, '&lt;')}</pre>`)
  } catch (err) {
    lines.push(`<p style="color:red"><strong>Fetch error:</strong> ${err.message}</p>`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(`<!doctype html><html><body style="font-family:sans-serif;padding:20px;max-width:800px;">${lines.join('\n')}</body></html>`)
}