import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Bookmark,
  CalendarCheck,
  Search,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  User,
  FileText,
  MapPin,
  MessageSquare,
  Crown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { listMyApplications } from '../services/applicationService'
import { listMySavedJobs } from '../services/savedJobService'
import { listMyInterviews } from '../services/interviewService'
import { getProfile } from '../services/profileService'
import NotificationBell from '../components/NotificationBell'
import AIRecommendedJobs from '../components/ai/AIRecommendedJobs'

export default function JobSeekerDashboard() {
  const { user, profile: authProfile } = useAuth()
  
  const [stats, setStats] = useState({
    applications: 0,
    saved: 0,
    interviews: 0,
    shortlisted: 0,
  })
  const [recentApps, setRecentApps] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const [apps, saved, interviews, profileDoc] = await Promise.all([
          listMyApplications(user.uid),
          listMySavedJobs(user.uid),
          listMyInterviews(user.uid, 'job_seeker'),
          getProfile(user.uid),
        ])
        if (!alive) return

        const upcomingInterviews = interviews.filter(
          (i) => i.status === 'scheduled'
        ).length

        setStats({
          applications: apps.length,
          saved: saved.length,
          interviews: upcomingInterviews,
          shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
        })
        
        setRecentApps(apps.slice(0, 3))
        setSavedJobs(saved.slice(0, 4))
        setProfile(profileDoc)
      } catch (err) {
        console.warn('Dashboard load failed:', err)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const getStatusColor = (status) => {
    if (status === 'hired') return 'text-green-700 bg-green-50'
    if (status === 'rejected') return 'text-red-700 bg-red-50'
    if (status === 'shortlisted') return 'text-[#1db365] bg-[#e6f7ee]'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-[#1a1c23] text-white pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="container-app relative max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Welcome */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  authProfile?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 flex-wrap">
                  Welcome back, {authProfile?.fullName?.split(' ')[0] || 'Job Seeker'}!
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Here is your job hunt at a glance.
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                to="/jobs"
                className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !text-white shadow-xl !border-0"
              >
                <Search size={16} /> Find Jobs
              </Link>
              <Link
                to="/profile/job-seeker"
                className="btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black shadow-xl !border-0"
              >
                <User size={16} /> Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-6xl -mt-8 relative z-10">
        
        <div className="space-y-6">
          
          {/* 1. EXACT STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="APPLICATIONS" value={loading ? '—' : stats.applications} icon={Briefcase} />
            <StatCard title="SAVED JOBS" value={loading ? '—' : stats.saved} icon={Bookmark} />
            <StatCard title="SHORTLISTED" value={loading ? '—' : stats.shortlisted} icon={TrendingUp} />
            <StatCard title="INTERVIEWS" value={loading ? '—' : stats.interviews} icon={CalendarCheck} />
          </div>

          {/* 2. PROFILE COMPLETENESS DARK BANNER */}
          <div className="bg-[#1a1c23] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-[#1db365]" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Make your profile stand out</p>
                <p className="text-sm text-gray-400">Candidates who complete their profile are <strong className="text-white">3x more likely</strong> to get shortlisted by employers.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link to="/profile/job-seeker" className="w-full sm:w-auto btn-primary !bg-[#eab308] hover:!bg-[#ca8a04] !text-black !border-0 !py-2.5 !px-6 shrink-0 font-bold">
                Complete Profile
              </Link>
            </div>
          </div>

          {/* 3. QUICK ACTIONS BAR */}
          <div className="card !p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border border-gray-200">
            <div className="flex flex-wrap gap-2">
              <Link to="/jobs" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                <Search size={14} /> Browse Jobs
              </Link>
              <Link to="/applications" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                <Briefcase size={14} /> My Applications
              </Link>
              <Link to="/saved-jobs" className="btn-outline !py-2 !px-3 text-sm !text-[#7c3aed] !bg-[#f3e8ff] !border-[#e9d5ff]">
                <Bookmark size={14} /> Saved Jobs
              </Link>
              <Link to="/interviews" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                <CalendarCheck size={14} /> Interviews
              </Link>
              <Link to="/messages" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                <MessageSquare size={14} /> Messages
              </Link>
              <Link to="/profile/job-seeker" className="btn-outline !py-2 !px-3 text-sm !border-gray-200">
                <FileText size={14} /> Build CV
              </Link>
            </div>
          </div>

          {/* 4. RECENT APPLICATIONS & AI JOBS */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Recent Applications */}
            <div className="card !p-0 border border-gray-200 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Briefcase size={16} className="text-[#1db365]" /> RECENT APPLICATIONS
                </h2>
                <Link to="/applications" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              
              {loading ? (
                <div className="p-5 space-y-3">
                   {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : recentApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 flex-1">
                  <div className="w-16 h-16 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
                    <Briefcase size={28} className="text-[#1db365]" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">No Applications Yet</p>
                  <p className="text-sm text-gray-500 mt-1 mb-5 text-center">You haven't applied to any jobs yet. Start exploring!</p>
                  <Link to="/jobs" className="btn-primary !bg-[#1db365] hover:!bg-[#179955] !border-0 !py-2 !px-6 text-sm shadow-md">
                    <Search size={16} /> Find Jobs
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentApps.map((app) => (
                    <Link key={app.id} to={`/applications/${app.id}`} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{app.jobTitle}</p>
                        <p className="text-xs text-gray-500 truncate">{app.companyName}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${getStatusColor(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommended Jobs */}
            <div className="card !p-0 border border-gray-200 overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <TrendingUp size={16} className="text-[#1db365]" /> AI RECOMMENDED
                </h2>
                <Link to="/jobs" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-5 flex-1">
                {/* Assuming AIRecommendedJobs is a component that renders a list. If it has its own padding/header, adjust accordingly */}
                <AIRecommendedJobs />
              </div>
            </div>

          </div>

          {/* 5. SAVED JOBS (FULL WIDTH) */}
          <div className="card !p-0 border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Bookmark size={16} className="text-[#7c3aed]" /> SAVED JOBS
              </h2>
              <Link to="/saved-jobs" className="text-xs font-bold text-[#7c3aed] hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            
            {savedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-4">
                  <Bookmark size={28} className="text-[#7c3aed]" />
                </div>
                <p className="font-bold text-gray-800 text-lg">No Saved Jobs Yet</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">Save jobs you're interested in to apply later.</p>
                <Link to="/jobs" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !text-white !border-0 !py-2.5 !px-6 text-sm shadow-md">
                  <Search size={16} /> Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 p-5">
                 {/* Map saved jobs here if you want them in a grid */}
                 {savedJobs.map(job => (
                   <div key={job.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                     <p className="font-bold text-sm text-gray-800 truncate">{job.title}</p>
                     <p className="text-xs text-gray-500 truncate">{job.companyName}</p>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* 6. UPCOMING INTERVIEWS (FULL WIDTH) */}
          <div className="card !p-0 border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <CalendarCheck size={16} className="text-[#1db365]" /> UPCOMING INTERVIEWS
              </h2>
              <Link to="/interviews" className="text-xs font-bold text-[#1db365] hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            
            {stats.interviews === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-[#e6f7ee] flex items-center justify-center mb-4">
                  <CalendarCheck size={28} className="text-[#1db365]" />
                </div>
                <p className="font-bold text-gray-800 text-lg">No Upcoming Interviews</p>
                <p className="text-sm text-gray-500 mt-1">Keep applying to land your next interview.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                 {/* Map interviews here later */}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// Helper Component for the Stat Cards
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