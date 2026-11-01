import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Users,
  Crown,
  ArrowRight,
  Bookmark,
  Briefcase,
  ChevronDown,
  Filter,
  Lock
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PIPELINE = [
  { id: 'all', label: 'All', count: 0 },
  { id: 'shortlisted', label: 'Shortlisted', count: 0 },
  { id: 'contacted', label: 'Contacted', count: 0 },
  { id: 'interviewing', label: 'Interviewing', count: 0 },
  { id: 'hired', label: 'Hired', count: 0 },
  { id: 'rejected', label: 'Rejected', count: 0 },
]

export default function EmployerSavedCandidates() {
  const { profile } = useAuth()
  const [filter, setFilter] = useState('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20 font-sans">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-brand-950 text-white pt-10 pb-8 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container-app relative max-w-6xl">
          {/* Breadcrumb / Label */}
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-300 mb-4 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            {profile?.fullName || 'Employer'} - Recruitment Dashboard
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                Saved Candidates
                <span className="text-[10px] font-bold bg-white/10 border border-white/20 text-white rounded-full px-2 py-0.5 mt-2">
                  FREE
                </span>
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Review, shortlist and manage candidates you've saved for your open positions.
              </p>
            </div>
          </div>

          {/* ─── UPGRADE BANNER ─── */}
          <div className="bg-brand-900/40 border border-brand-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Free Plan — 10 candidate reveals per job post</p>
                <p className="text-xs text-white/60 mt-1">
                  Upgrade for more application views, CV downloads, and daily contact reveals.
                </p>
                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-white/80">
                  <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">👁 10 app views/job</span>
                  <span className="flex items-center gap-1 text-red-300 bg-red-500/10 px-2 py-0.5 rounded">✖ No CV downloads</span>
                </div>
              </div>
            </div>
            <Link 
              to="/employer/upgrade" 
              className="btn-primary !bg-accent-500 hover:!bg-accent-600 !text-white !border-none shadow-lg shadow-accent-500/20 shrink-0 w-full sm:w-auto text-center justify-center"
            >
              <Crown size={14} /> Upgrade to Premium
            </Link>
          </div>
        </div>
      </div>

      {/* ─── STATS BAR (6 Columns) ─── */}
      <div className="bg-brand-600 text-white">
        <div className="container-app max-w-6xl">
          <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-white/10">
            {PIPELINE.map((s) => (
              <div key={s.id} className="py-4 text-center">
                <p className="text-2xl font-extrabold">{s.count}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-1 flex items-center justify-center gap-1">
                  {s.id !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-6xl mt-6">
        
        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6 space-y-4">
          
          {/* Top Row: Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-2">Filter by status</span>
            {PIPELINE.map(p => (
              <button
                key={p.id}
                onClick={() => setFilter(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                  filter === p.id 
                    ? 'bg-brand-50 border-brand-200 text-brand-700' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p.label} <span className="opacity-60 ml-1">{p.count}</span>
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Bottom Row: Dropdowns & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] font-bold uppercase text-gray-400">Filter by Job</label>
                <select 
                  className="w-full appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-brand-500"
                  value={jobFilter}
                  onChange={(e) => setJobFilter(e.target.value)}
                >
                  <option value="all">All Jobs</option>
                  {/* Map your jobs here later */}
                  <option value="job1">Senior Frontend Engineer</option>
                  <option value="job2">Product Designer</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative flex-1">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] font-bold uppercase text-gray-400">Sort By</label>
                <select 
                  className="w-full appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:border-brand-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative flex-[1.5]">
              <label className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] font-bold uppercase text-gray-400">Search Candidates</label>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <input 
                  type="text" 
                  placeholder="Name, title, or job..." 
                  className="flex-1 px-3 py-2 text-sm text-gray-700 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="px-3 py-2 text-brand-600 hover:bg-gray-50 transition">
                  <Search size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Empty State / Candidates List */}
        <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-20 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
            <Bookmark size={32} className="text-brand-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">No Saved Candidates Yet</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
            You haven't saved any candidates yet. Browse the talent directory to find and bookmark top professionals.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/employer/talent" className="btn-primary !bg-brand-600 hover:!bg-brand-700 !py-2.5 !px-6 text-sm shadow-md">
              <Users size={16} /> Browse Talent Directory
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}