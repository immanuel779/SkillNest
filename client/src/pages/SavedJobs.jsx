import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, MapPin, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMySavedJobs, unsaveJob } from '../services/savedJobService'

export default function SavedJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await listMySavedJobs(user.uid)
      setJobs(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const remove = async (job) => {
    await unsaveJob(user.uid, job.id)
    setJobs((list) => list.filter((j) => j.id !== job.id))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Saved Jobs</h1>
        <p className="text-gray-500 mt-1">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} bookmarked
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Bookmark size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700">No saved jobs</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Bookmark jobs you're interested in to find them here.
          </p>
          <Link to="/jobs" className="btn-primary inline-flex">
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((j) => (
            <div key={j.id} className="card card-hover">
              <div className="flex items-start justify-between gap-4">
                <Link to={`/jobs/${j.id}`} className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">{j.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{j.companyName}</p>
                  <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {j.location || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={12} /> {j.jobType?.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => remove(j)}
                  className="btn-outline !py-2 !px-3 text-sm shrink-0 !text-red-600 !border-red-200 hover:!bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}