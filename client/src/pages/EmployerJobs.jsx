import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Briefcase,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyJobs, updateJob, deleteJob } from '../services/jobService'
import { countApplicationsByEmployer } from '../services/applicationService'

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-600',
    published: 'bg-green-50 text-green-700 border border-green-100',
    unpublished: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    closed: 'bg-red-50 text-red-700 border border-red-100',
  }
  return (
    <span className={`badge ${styles[status] || styles.draft}`}>{status}</span>
  )
}

export default function EmployerJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user) return
    try {
      const list = await listMyJobs(user.uid)

      // Fetch REAL counts from the applications collection.
      // Overrides the denormalized job.applicantCount, which may be
      // stale or missing for older jobs.
      let realCounts = {}
      try {
        realCounts = await countApplicationsByEmployer(
          user.uid,
          list.map((j) => j.id)
        )
      } catch (err) {
        console.warn('Falling back to stored applicantCount:', err?.message)
      }

      setJobs(
        list.map((j) => ({
          ...j,
          applicantCount:
            typeof realCounts[j.id] === 'number'
              ? realCounts[j.id]
              : j.applicantCount || 0,
        }))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const togglePublish = async (job) => {
    const next = job.status === 'published' ? 'unpublished' : 'published'
    await updateJob(job.id, { status: next })
    load()
  }

  const close = async (job) => {
    await updateJob(job.id, { status: 'closed' })
    load()
  }

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"?`)) return
    await deleteJob(job.id)
    load()
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">My Jobs</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage your job postings.
          </p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="btn-primary w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Post a job
        </Link>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No jobs yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Post your first role to start receiving applicants.
          </p>
          <Link to="/employer/jobs/new" className="btn-primary inline-flex">
            <Plus size={16} /> Post a job
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">
                      {j.title}
                    </h3>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="mt-1 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {j.location || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {j.applicantCount || 0}{' '}
                      {j.applicantCount === 1 ? 'applicant' : 'applicants'}
                    </span>
                    <span>
                      {j.jobType?.replace('_', ' ')} · {j.workMode}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link
                    to={`/employer/jobs/${j.id}/applicants`}
                    className="btn-outline !py-2 !px-3 text-sm"
                  >
                    <Users size={14} /> Applicants
                  </Link>
                  <Link
                    to={`/employer/jobs/${j.id}/edit`}
                    className="btn-outline !py-2 !px-3 text-sm"
                  >
                    <Pencil size={14} /> Edit
                  </Link>
                  <button
                    onClick={() => togglePublish(j)}
                    className="btn-outline !py-2 !px-3 text-sm"
                  >
                    {j.status === 'published' ? (
                      <>
                        <EyeOff size={14} /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye size={14} /> Publish
                      </>
                    )}
                  </button>
                  {j.status !== 'closed' && (
                    <button
                      onClick={() => close(j)}
                      className="btn-outline !py-2 !px-3 text-sm"
                    >
                      <CheckCircle2 size={14} /> Close
                    </button>
                  )}
                  <button
                    onClick={() => remove(j)}
                    className="btn-outline !py-2 !px-3 text-sm !text-red-600 !border-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}