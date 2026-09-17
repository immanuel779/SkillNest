import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getCompany } from '../services/companyService'

export default function CompanyLegacyRedirect() {
  const { id } = useParams()
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const c = await getCompany(id)
        if (!alive) return
        if (c?.slug) setTarget(`/c/${c.slug}`)
        else setTarget('not-found')
      } catch {
        if (alive) setTarget('not-found')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (target === 'not-found') return <Navigate to="/jobs" replace />
  return <Navigate to={target} replace />
}