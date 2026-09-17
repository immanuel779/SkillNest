import { useEffect, useMemo, useState } from 'react'
import { Search, Building2, ExternalLink, MapPin } from 'lucide-react'
import { listAllCompanies } from '../../services/adminService'

export default function AdminCompanies() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await listAllCompanies()
        if (alive) setItems(list)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((c) =>
      [c.name, c.industry, c.location].filter(Boolean).join(' ').toLowerCase().includes(needle)
    )
  }, [items, q])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Companies</h2>
        <p className="text-sm text-gray-500 mt-1">
          {items.length} employer companies registered.
        </p>
      </div>

      <div className="card !p-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <Search size={16} className="text-brand-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by company, industry, or location..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          No companies match your search.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center text-white shrink-0 overflow-hidden">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{c.name}</h3>
                  {c.industry && (
                    <p className="text-xs text-gray-500 mt-0.5">{c.industry}</p>
                  )}
                  {c.location && (
                    <p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1">
                      <MapPin size={11} /> {c.location}
                    </p>
                  )}
                </div>
              </div>

              {c.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{c.description}</p>
              )}

              {c.website && (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-700 font-semibold mt-3 inline-flex items-center gap-1 hover:underline"
                >
                  {c.website.replace(/^https?:\/\//, '').slice(0, 30)}
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}