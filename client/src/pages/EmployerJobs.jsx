import { useEffect, useState, useMemo } from 'react'
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
  Banknote,
  Share2,
  Search,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyJobs, updateJob, deleteJob } from '../services/jobService'
import { countApplicationsByEmployer } from '../services/applicationService'
import { formatSalaryRange } from '../utils/currency'
import { useToast } from '../context/ToastContext' // Added for the share notification

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-600 border border-gray-200',
    published: 'bg-[#e6f7ee] text-[#1db365] border border-[#bcf0d5]',
    unpublished: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    closed: 'bg-red-50 text-red-700 border border-red-200',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}

export default function EmployerJobs() {
  const { user } = useAuth()
  const toast = useToast() // Initialize toast

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Search & Filter State
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const load = async () => {
    if (!user) return
    try {
      const list = await listMyJobs(user.uid)

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

  const closeJob = async (job) => {
    if (!window.confirm('Are you sure you want to close this job? It will no longer accept applications.')) return
    await updateJob(job.id, { status: 'closed' })
    load()
  }

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}" permanently?`)) return
    await deleteJob(job.id)
    load()
  }

  // Share function (Copies to clipboard)
  const handleShare = (jobId) => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`
    navigator.clipboard.writeText(jobUrl).then(() => {
      toast.success('Link Copied!', 'Job link copied to clipboard. Ready to share!')
    }).catch(() => {
      toast.error('Failed to copy', 'Please try copying from the URL bar.')
    })
  }

  // Filter & Search Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                            (j.location || '').toLowerCase().includes(search.toLowerCase())
      
      const matchesTab = activeTab === 'all' || j.status === activeTab
      
      return matchesSearch && matchesTab
    })
  }, [jobs, search, activeTab])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#1db365]" size={32} />
      </div>
    )
  }

  return (
    <div className="container-app py-6 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">My Jobs</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Manage your job postings, track applicants, and share your roles.
          </p>
        </div>
        <Link
          to="/employer/jobs/new"
          className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 w-full sm:w-auto justify-center shadow-lg shadow-[#1db365]/20"
        >
          <Plus size={18} /> Post a Job
        </Link>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* ─── CONTROLS (SEARCH & TABS) ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {['all', 'published', 'draft', 'closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-50 text-[#7c3aed]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab} 
              {tab !== 'all' && (
                <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {jobs.filter(j => j.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition"
          />
        </div>
      </div>

      {/* ─── JOB LIST ─── */}
      {filteredJobs.length === 0 ? (
        <div className="card text-center py-20 border border-gray-200 border-dashed rounded-2xl bg-white shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} className="text-gray-300" />
          </div>
          <p className="font-extrabold text-xl text-gray-800">No jobs found</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {jobs.length === 0 
              ? "You haven't posted any jobs yet. Create your first role to start receiving applicants."
              : "No jobs match your current search or filter. Try clearing them."}
          </p>
          {jobs.length === 0 && (
            <Link to="/employer/jobs/new" className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 inline-flex mt-6 shadow-md">
              <Plus size={18} /> Post a Job
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((j) => {
            const salaryText = formatSalaryRange(j.currency, j.salaryMin, j.salaryMax)
            
            return (
              <div key={j.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-[#1db365]/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Side: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-lg font-extrabold text-gray-900 truncate">
                        {j.title}
                      </h3>
                      <StatusBadge status={j.status} />
                    </div>
                    
                    <div className="text-[13px] text-gray-600 flex flex-wrap gap-x-5 gap-y-2">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" /> {j.location || 'Remote'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" /> 
                        <span className={j.applicantCount > 0 ? 'font-bold text-[#1db365]' : ''}>
                          {j.applicantCount || 0} {j.applicantCount === 1 ? 'applicant' : 'applicants'}
                        </span>
                      </span>
                      {salaryText && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                          <Banknote size={14} className="text-gray-400" /> {salaryText}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <Briefcase size={14} className="text-gray-400" /> {j.jobType?.replace('_', ' ')} · {j.workMode}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 lg:justify-end">
                    
                    {/* Primary Actions */}
                    <Link
                      to={`/employer/jobs/${j.id}/applicants`}
                      className="btn-outline !py-2 !px-3 text-sm !border-[#1db365] !text-[#1db365] hover:!bg-[#e6f7ee]"
                    >
                      <Users size={14} /> Applicants
                    </Link>
                    
                    {/* 👇 SHARE BUTTON 👇 */}
                    <button
                      onClick={() => handleShare(j.id)}
                      className="btn-outline !py-2 !px-3 text-sm !border-blue-200 !text-blue-600 hover:!bg-blue-50 transition-colors"
                      title="Copy job link to share"
                    >
                      <Share2 size={14} /> Share
                    </button>

                    <Link
                      to={`/employer/jobs/${j.id}/edit`}
                      className="btn-outline !py-2 !px-3 text-sm !border-gray-200 !text-gray-700 hover:!bg-gray-50"
                    >
                      <Pencil size={14} /> Edit
                    </Link>

                    <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

                    {/* Toggle Actions */}
                    <button
                      onClick={() => togglePublish(j)}
                      className="btn-outline !py-2 !px-3 text-sm !border-gray-200 !text-gray-600 hover:!bg-gray-50"
                    >
                      {j.status === 'published' ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
                    </button>

                    {j.status !== 'closed' && (
                      <button
                        onClick={() => closeJob(j)}
                        className="btn-outline !py-2 !px-3 text-sm !border-gray-200 !text-gray-600 hover:!bg-gray-50"
                      >
                        <CheckCircle2 size={14} /> Close
                      </button>
                    )}

                    <button
                      onClick={() => remove(j)}
                      className="btn-outline !py-2 !px-3 text-sm !text-red-600 !border-red-200 hover:!bg-red-50"
                      title="Delete Job"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}