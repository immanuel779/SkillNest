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

        // 3. Fetch Saved Candidates (Assuming a 'savedCandidates' collection)
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
        
        // Map applications with applicant info for the recent list
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-[#1a1c23] text-white pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="container-app relative max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Welcome */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl font-bold">
                {profile?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'E'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 flex-wrap">
                  Welcome back, {profile?.fullName || 'Employer'}!
                  <span className="text-[10px] font-bold bg-white/10 text-gray-300 border border-white/20 rounded-full px-2 py-0.5 uppercase tracking-wide">
                    FREE
                  </span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Here's your recruitment overview for today.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                to="/employer/jobs/new"
                className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !text-white shadow-xl !border-0"
              >
                <Plus size={16} /> Post a Job
              </Link>
              <Link
                to="/employer/upgrade"
                className="btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black shadow-xl !border-0"
              >
                <Crown size={16} /> Upgrade Plan
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-10 border-b border-white/10 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.v}
                onClick={() => setActiveTab(t.v)}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === t.v
                    ? 'border-[#1db365] text-white'
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
      <div className="container-app max-w-6xl -mt-8 relative z-10">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. EXACT STATS CARDS FROM SCREENSHOT */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="TOTAL JOBS POSTED" value={loading ? '—' : stats.totalJobs} icon={Briefcase} />
              <StatCard title="ACTIVE JOBS" value={loading ? '—' : stats.activeJobs} icon={CheckCircle2} />
              <StatCard title="TOTAL VIEWS" value={loading ? '—' : stats.totalViews} icon={Eye} />
              <StatCard title="CANDIDATES APPLIED" value={loading ? '—' : stats.totalCandidates} icon={Users} />
              
              {/* Upgrade Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#7c3aed] font-bold text-lg mb-1">Free</p>
                  <p className="text-xs text-gray-500 font-semibold tracking-wider">CURRENT PLAN</p>
                </div>
                <Link to="/employer/upgrade" className="text-[#d97706] text-sm font-semibold flex items-center gap-1 mt-3 hover:underline">
                  ↑ Upgrade now
                </Link>
                <UserCheck className="absolute top-4 right-4 text-gray-100" size={48} />
              </div>
            </div>

            {/* 2. FREE PLAN DARK BANNER */}
            <div className="bg-[#1a1c23] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Users size={24} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">You're on the Free Plan</p>
                  <p className="text-sm text-gray-400">You can have 1 active job and view up to 10 applications per job. CV downloads are not available on the free plan.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Plan limits pills */}
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full flex items-center gap-1"><Briefcase size={12}/> 1 active job</span>
                  <span className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full flex items-center gap-1"><Eye size={12}/> 10 application views / job</span>
                  <span className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full flex items-center gap-1"><Bell size={12}/> 1 phone reveal / 24h</span>
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={12}/> No CV downloads</span>
                </div>
                
                <Link to="/employer/upgrade" className="w-full sm:w-auto btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black !border-0 !py-2.5 !px-6 shrink-0 font-bold">
                  <Crown size={16} /> View Plans & Upgrade
                </Link>
              </div>
            </div>

            {/* 3. QUICK ACTIONS BAR */}
            <div className="card !p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border border-gray-200">
              <div className="flex flex-wrap gap-2">
                <Link to="/employer/jobs" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Briefcase size={14} /> Manage Jobs
                </Link>
                <Link to="/employer/candidates" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Users size={14} /> View Candidates
                </Link>
                <Link to="/employer/saved-candidates" className="btn-outline !py-2 !px-3 text-sm !text-[#7c3aed] !bg-[#f3e8ff] !border-[#e9d5ff]">
                  <Bookmark size={14} /> Saved Candidates
                </Link>
                <Link to="/employer/company" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Building2 size={14} /> Company Profile
                </Link>
                <Link to="/employer/talent" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Search size={14} /> Browse Candidates
                </Link>
                <Link to="/employer/talent-inbox" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Inbox size={14} /> Talent Inbox
                </Link>
                <Link to="/employer/upgrade" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <Crown size={14} className="text-[#eab308]" /> Upgrade Plan
                </Link>
                <Link to="/employer/verification" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                  <ShieldCheck size={14} className="text-blue-500" /> Get Verified
                </Link>
              </div>
            </div>

            {/* 4. RECENT CANDIDATES & TOP PERFORMING JOBS */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Recent Candidates */}
              <div className="card !p-0 border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Users size={16} className="text-[#1db365]" /> RECENT CANDIDATES
                  </h2>
                  <Link to="/employer/candidates" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                    View All <ArrowRight size={12} />
                  </Link>
                </div>
                
                {recentCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
                      <Inbox size={28} className="text-[#1db365]" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">No Candidates Yet</p>
                    <p className="text-sm text-gray-500 mt-1">Candidates who apply to your jobs will appear here.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentCandidates.map(c => (
                      <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div>
                          <p className="font-semibold text-sm capitalize text-gray-800">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.jobTitle}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-[#e6f7ee] text-[#1db365] px-2 py-1 rounded capitalize">{c.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Performing Jobs */}
              <div className="card !p-0 border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <TrendingUp size={16} className="text-[#1db365]" /> TOP PERFORMING JOBS
                  </h2>
                  <Link to="/employer/jobs" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                    View All <ArrowRight size={12} />
                  </Link>
                </div>
                
                {recentJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
                      <TrendingUp size={28} className="text-[#1db365]" />
                    </div>
                    <p className="font-bold text-gray-800 text-lg">No Active Jobs</p>
                    <p className="text-sm text-gray-500 mt-1">Post a job to see performance metrics here.</p>
                    <Link to="/employer/jobs/new" className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 !py-2 !px-6 text-sm mt-5 shadow-md">
                      <Plus size={16} /> Post a Job
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentJobs.map(j => (
                      <Link key={j.id} to={`/employer/jobs/${j.id}/applicants`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{j.title}</p>
                          <p className="text-xs text-gray-500">{j.applicantCount || 0} applicants · {j.views || 0} views</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* 5. SAVED CANDIDATES (FULL WIDTH) */}
            <div className="card !p-0 border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Bookmark size={16} className="text-[#7c3aed]" /> SAVED CANDIDATES
                </h2>
                <Link to="/employer/saved-candidates" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              
              {savedCandidatesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                    <Bookmark size={28} className="text-[#7c3aed]" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">No Saved Candidates Yet</p>
                  <p className="text-sm text-gray-500 mt-1 mb-5">Browse talent profiles and save the ones you'd like to hire later.</p>
                  <Link to="/employer/talent" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white !border-0 !py-2.5 !px-6 text-sm shadow-md">
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
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Briefcase size={16} className="text-[#1db365]" /> RECENT JOB POSTS
                </h2>
                <Link to="/employer/jobs" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
                    <Briefcase size={28} className="text-[#1db365]" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">No Jobs Posted Yet</p>
                  <p className="text-sm text-gray-500 mt-1">Start attracting candidates by posting your first job vacancy.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                    {recentJobs.map(j => (
                      <Link key={j.id} to={`/employer/jobs/${j.id}/applicants`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{j.title}</p>
                          <p className="text-xs text-gray-500">{j.status} · {j.applicantCount || 0} applicants · {j.views || 0} views</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300" />
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
            <div className="card bg-[#e6f7ee] border-[#bcf0d5] flex items-center justify-between p-4">
              <div>
                <h2 className="font-bold text-[#0f5132]">Browse Talent</h2>
                <p className="text-xs text-[#198754] mt-0.5">Find job seekers actively looking for roles on SkillNest.</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-8 !py-1.5 text-sm w-48" placeholder="Search skills..." />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {talentList.length === 0 ? (
                <div className="col-span-full card text-center py-16">
                  <UserCheck size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-gray-700">No Talent Posted Yet</p>
                  <p className="text-sm text-gray-500 mt-1">When job seekers create profiles, they'll show up here.</p>
                </div>
              ) : (
                talentList.map(t => (
                  <div key={t.id} className="card hover:shadow-lg transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#e6f7ee] flex items-center justify-center text-[#1db365] font-bold overflow-hidden shrink-0">
                        {t.photoURL ? <img src={t.photoURL} className="w-full h-full object-cover" /> : t.fullName?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{t.fullName || 'Job Seeker'}</p>
                        <p className="text-xs text-[#1db365] truncate">{t.headline || 'Open to work'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(t.skills || []).slice(0,3).map((s, i) => (
                         <span key={i} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                           {typeof s === 'string' ? s : s.name}
                         </span>
                      ))}
                      {(t.skills || []).length > 3 && (
                         <span className="text-[10px] text-gray-400 px-1 py-0.5">+{t.skills.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                       <Link to={`/applicants/${t.id}`} className="btn-outline flex-1 !py-1.5 text-xs text-center">View Profile</Link>
                       <button className="btn-primary !bg-[#1db365] !border-0 flex-1 !py-1.5 text-xs"><Bookmark size={12}/> Save</button>
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-3xl font-extrabold text-[#1db365]">{value}</p>
          <p className="text-[10px] font-bold text-gray-500 tracking-wider mt-1">{title}</p>
        </div>
        <div className="text-gray-100">
          <Icon size={36} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}