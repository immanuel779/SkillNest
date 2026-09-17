import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Newspaper } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyCompany } from '../services/companyService'
import CompanyUpdateComposer from '../components/company/CompanyUpdateComposer'
import CompanyUpdateFeed from '../components/company/CompanyUpdateFeed'
import { friendlyError } from '../utils/errors'

export default function EmployerUpdates() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const c = await getMyCompany(user.uid)
        if (alive) setCompany(c)
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="container-app py-16 max-w-2xl">
        <div className="card text-center">
          <h2 className="text-xl font-bold">Create your company profile first</h2>
          <p className="text-gray-500 mt-2">
            You need a company before you can post updates.
          </p>
          <Link to="/employer/company" className="btn-primary mt-6 inline-flex">
            Create company profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-2xl">
      <Link
        to="/employer/jobs"
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Newspaper size={26} className="text-brand-600" />
            Updates
          </h1>
          <p className="text-gray-500 mt-1">
            Share news with your followers on {company.name}.
          </p>
        </div>
        {company.slug && (
          <a
            href={`/c/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <ExternalLink size={14} /> View public space
          </a>
        )}
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="mb-6">
        <CompanyUpdateComposer
          company={company}
          onPosted={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      <CompanyUpdateFeed
        companyId={company.id}
        companyOwnerId={company.ownerId}
        canPost
        refreshKey={refreshKey}
      />
    </div>
  )
}