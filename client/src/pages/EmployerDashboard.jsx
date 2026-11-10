import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle2,
  Crown,
  Plus,
  ArrowRight,
  Bell,
  LayoutDashboard,
  UserCheck,
  Bookmark,
  Search,
  Building2,
  Inbox,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { listMyJobs } from '../services/jobService'
import { listPublicTalent } from '../services/talentService'
import NotificationBell from '../components/NotificationBell'

const TABS = [
  { v: 'overview', l: 'Overview', icon: LayoutDashboard },
  { v: 'talent', l: 'Talent Directory', icon: UserCheck },
  { v: 'notifications', l: 'Notifications', icon: Bell },
]

export default function EmployerDashboard() {
  const { user, profile } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Data State
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalViews: 0,
    totalCandidates: 0,
    savedCandidates: 0,
  })
  const [recentJobs, setRecentJobs] = useState([])
  const [recentCandidates, setRecentCandidates] = useState([])
  const [savedCandidatesList, setSavedCandidatesList] = useState([])
  const [talentList, setTalentList] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        // 1. Fetch Jobs
        const jobs = await listMyJobs(user.uid).catch(() => [])
        const active = jobs.filter((j) => j.status === 'published')
        const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0)

        // 2. Fetch Applications (Candidates)
        let apps = []
        try {
          const q = query(
            collection(db, 'applications'),
            where('employerId', '==', user.uid)
          )
          const snap = await getDocs(q)
          apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        } catch (err) {
          console.warn('applications query failed:', err)
        }

        // 3. Fetch Saved Candidates
        let saved = []
        try {
          const qSaved = query(
            collection(db, 'savedCandidates'),
            where('employerId', '==', user.uid)
          )
          const snapSaved = await getDocs(qSaved)
          saved = snapSaved.docs.map((d) => ({ id: d.id, ...d.data() }))
        } catch (err) {
          console.warn('saved candidates query failed:', err)
        }

        // 4. Fetch Talent Directory
        const talent = await listPublicTalent(10).catch(() => [])

        if (!alive) return

        setStats({
          totalJobs: jobs.length,
          activeJobs: active.length,
          totalViews,
          totalCandidates: apps.length,
          savedCandidates: saved.length,
        })

        setRecentJobs(jobs.slice(0, 4))
        setSavedCandidatesList(saved)
        
        const candidateList = apps.slice(0, 5).map((a) => ({
          id: a.id,
          name: a.applicantEmail?.split('@')[0] || 'Candidate',
          jobTitle: a.jobTitle || 'Job',
          status: a.status,
        }))
        setRecentCandidates(candidateList)
        setTalentList(talent)

      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user])

  return (
    // overflow-x-hidden prevents horizontal scrolling on mobile
    <div className="min-h-screen bg-gray-50/50 pb-20 overflow-x-hidden">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-[#1a1c23] text-white pt-8 pb-16 px-4 sm:px-6 relative w-full">
        <div className="container-app relative max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Welcome */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg shadow-[#7c3aed]/20">
                {profile?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'E'}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold flex items-center gap-2 flex-wrap">
                  <span className="truncate">Welcome back, {profile?.fullName || 'Employer'}!</span>
                  <span className="text-[10px] font-bold bg-white/10 text-gray-300 border border-white/20 rounded-full px-2 py-0.5 uppercase tracking-wide">
                    FREE
                  </span>
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Here's your recruitment overview for today.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
              <Link
                to="/employer/jobs/new"
                className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white shadow-xl !border-0 justify-center w-full sm:w-auto"
              >
                <Plus size={16} /> Post a Job
              </Link>
              <Link
                to="/employer/upgrade"
                className="btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black shadow-xl !border-0 justify-center w-full sm:w-auto"
              >
                <Crown size={16} /> Upgrade Plan
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-8 border-b border-white/10 overflow-x-auto no-scrollbar whitespace-nowrap">
            {TABS.map((t) => (
              <button
                key={t.v}
                onClick={() => setActiveTab(t.v)}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition ${
                  activeTab === t.v
                    ? 'border-[#7c3aed] text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <t.icon size={16} />
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              <StatCard title="TOTAL JOBS" value={loading ? '—' : stats.totalJobs} icon={Briefcase} />
              <StatCard title="ACTIVE JOBS" value={loading ? '—' : stats.activeJobs} icon={CheckCircle2} />
              <StatCard title="TOTAL VIEWS" value={loading ? '—' : stats.totalViews} icon={Eye} />
              <StatCard title="CANDIDATES" value={loading ? '—' : stats.totalCandidates} icon={Users} />
              
              {/* Upgrade Card - Spans 2 cols on mobile to fit perfectly */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1 relative overflow-hidden">
                <div>
                  <p className="text-[#7c3aed] font-bold text-lg mb-1">Free</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wider">CURRENT PLAN</p>
                </div>
                <Link to="/employer/upgrade" className="text-[#d97706] text-sm font-semibold flex items-center gap-1 mt-3 hover:underline relative z-10 w-max">
                  ↑ Upgrade now
                </Link>
                <UserCheck className="absolute -bottom-4 -right-4 text-[#f3e8ff]" size={80} />
              </div>
            </div>

            {/* 2. FREE PLAN DARK BANNER */}
            <div className="bg-[#1a1c23] rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-lg">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                  <Users size={20} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-base sm:text-lg">You're on the Free Plan</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">You can have 1 active job and view up to 10 applications per job. CV downloads are not available on the free plan.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] font-semibold">
                  <span className="bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded-full flex items-center gap-1"><Briefcase size={12}/> 1 active job</span>
                  <span className="bg-white/5 border border-white/10 text-gray-300 px-2 py-1 rounded-full flex items-center gap-1"><Eye size={12}/> 10 app views / job</span>
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={12}/> No CV downloads</span>
                </div>
                
                <Link to="/employer/upgrade" className="w-full sm:w-auto btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black !border-0 !py-2.5 !px-6 shrink-0 font-bold justify-center">
                  <Crown size={16} /> View Plans
                </Link>
              </div>
            </div>

            {/* 3. QUICK ACTIONS BAR */}
            <div className="card !p-4 border border-gray-200">
              <div className="flex flex-wrap gap-2">
                <Link to="/employer/jobs" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <Briefcase size={14} /> Jobs
                </Link>
                <Link to="/employer/candidates" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <Users size={14} /> Candidates
                </Link>
                <Link to="/employer/saved-candidates" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !text-[#7c3aed] !bg-[#f3e8ff] !border-[#e9d5ff]">
                  <Bookmark size={14} /> Saved
                </Link>
                <Link to="/employer/company" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <Building2 size={14} /> Profile
                </Link>
                <Link to="/employer/talent" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <Search size={14} /> Browse
                </Link>
                <Link to="/employer/talent-inbox" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <Inbox size={14} /> Inbox
                </Link>
                <Link to="/employer/verification" className="btn-outline !py-2 !px-3 text-xs sm:text-sm !border-gray-200">
                  <ShieldCheck size={14} className="text-blue-500" /> Verify
                </Link>
              </div>
            </div>

            {/* 4. RECENT CANDIDATES & TOP PERFORMING JOBS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Recent Candidates */}
              <div className="card !p-0 border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wide">
                    <Users size={16} className="text-[#7c3aed]" /> RECENT CANDIDATES
                  </h2>
                  <Link to="/employer/candidates" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                    View All <ArrowRight size={12} />
                  </Link>
                </div>
                
                {recentCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                      <Inbox size={28} className="text-[#7c3aed]" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">No Candidates Yet</p>
                    <p className="text-sm text-gray-500 mt-1">Candidates who apply will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentCandidates.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-sm capitalize text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.jobTitle}</p>
                        </div>
                        <span className="text-[10px] shrink-0 font-bold bg-[#f3e8ff] text-[#7c3aed] px-2 py-1 rounded capitalize">{c.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Performing Jobs */}
              <div className="card !p-0 border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wide">
                    <TrendingUp size={16} className="text-[#7c3aed]" /> TOP JOBS
                  </h2>
                  <Link to="/employer/jobs" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                    View All <ArrowRight size={12} />
                  </Link>
                </div>
                
                {recentJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                      <TrendingUp size={28} className="text-[#7c3aed]" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">No Active Jobs</p>
                    <p className="text-sm text-gray-500 mt-1">Post a job to see metrics here.</p>
                    <Link to="/employer/jobs/new" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-2 !px-6 text-sm mt-5 shadow-md">
                      <Plus size={16} /> Post a Job
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentJobs.map(j => (
                      <Link key={j.id} to={`/employer/jobs/${j.id}/applicants`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-sm text-gray-800 truncate">{j.title}</p>
                          <p className="text-xs text-gray-500">{j.applicantCount || 0} apps · {j.views || 0} views</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 5. SAVED CANDIDATES (FULL WIDTH) */}
            <div className="card !p-0 border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wide">
                  <Bookmark size={16} className="text-[#7c3aed]" /> SAVED CANDIDATES
                </h2>
                <Link to="/employer/saved-candidates" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              
              {savedCandidatesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                    <Bookmark size={28} className="text-[#7c3aed]" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">No Saved Candidates Yet</p>
                  <p className="text-sm text-gray-500 mt-1 mb-5">Browse talent profiles and save the ones you'd like to hire later.</p>
                  <Link to="/employer/talent" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white !border-0 !py-2 !px-6 text-sm shadow-md">
                    <Search size={16} /> Browse Candidates
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 p-5">
                   {/* Map saved candidates here later */}
                </div>
              )}
            </div>

            {/* 6. RECENT JOB POSTS (FULL WIDTH) */}
            <div className="card !p-0 border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wide">
                  <Briefcase size={16} className="text-[#7c3aed]" /> RECENT JOB POSTS
                </h2>
                <Link to="/employer/jobs" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                    <Briefcase size={28} className="text-[#7c3aed]" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">No Jobs Posted Yet</p>
                  <p className="text-sm text-gray-500 mt-1">Start attracting candidates by posting your first job vacancy.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                    {recentJobs.map(j => (
                      <Link key={j.id} to={`/employer/jobs/${j.id}/applicants`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-sm text-gray-800 truncate">{j.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{j.status} · {j.applicantCount || 0} applicants · {j.views || 0} views</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </Link>
                    ))}
                  </div>
              )}
            </div>

          </div>
        )}

        {/* ─── TAB: TALENT DIRECTORY ─── */}
        {activeTab === 'talent' && (
          <div className="space-y-6">
            <div className="card bg-[#f3e8ff] border-[#e9d5ff] flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
              <div>
                <h2 className="font-bold text-[#5b21b6]">Browse Talent</h2>
                <p className="text-xs text-[#6d28d9] mt-1">Find job seekers actively looking for roles on SkillNest.</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-8 !py-2 text-sm w-full sm:w-64 bg-white border-transparent focus:border-[#7c3aed]" placeholder="Search skills..." />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {talentList.length === 0 ? (
                <div className="col-span-full card text-center py-16">
                  <UserCheck size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-gray-700">No Talent Posted Yet</p>
                  <p className="text-sm text-gray-500 mt-1">When job seekers create profiles, they'll show up here.</p>
                </div>
              ) : (
                talentList.map(t => (
                  <div key={t.id} className="card hover:shadow-lg transition flex flex-col border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#7c3aed] font-bold overflow-hidden shrink-0">
                        {t.photoURL ? <img src={t.photoURL} className="w-full h-full object-cover" /> : t.fullName?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{t.fullName || 'Job Seeker'}</p>
                        <p className="text-xs text-[#7c3aed] truncate">{t.headline || 'Open to work'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(t.skills || []).slice(0,3).map((s, i) => (
                         <span key={i} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 truncate max-w-full">
                           {typeof s === 'string' ? s : s.name}
                         </span>
                      ))}
                      {(t.skills || []).length > 3 && (
                         <span className="text-[10px] text-gray-400 px-1 py-0.5">+{t.skills.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-2">
                       <Link to={`/applicants/${t.id}`} className="btn-outline flex-1 !py-2 text-xs text-center whitespace-nowrap">View Profile</Link>
                       <button className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 flex-1 !py-2 text-xs whitespace-nowrap flex items-center justify-center gap-1">
                         <Bookmark size={12} className="shrink-0"/> Save
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: NOTIFICATIONS ─── */}
        {activeTab === 'notifications' && (
          <div className="card text-center py-20">
             <Bell size={40} className="mx-auto text-gray-300 mb-3" />
             <p className="font-bold text-gray-700">All caught up!</p>
             <p className="text-sm text-gray-500 mt-1">Your recent notifications will appear here.</p>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper Component for the Stat Cards at the top
function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="min-w-0 pr-2">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#7c3aed] truncate">{value}</p>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1 truncate">{title}</p>
        </div>
        <div className="text-gray-100 shrink-0">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}