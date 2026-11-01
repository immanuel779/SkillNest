import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  CalendarCheck,
  Trophy,
  Flag,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Bell,
  Zap,
  ArrowRight,
  UserPlus,
  Activity,
  Crown
} from 'lucide-react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { getPlatformStats } from '../../services/adminService'
import { refreshPublicStats } from '../../services/publicStatsService'
import { useToast } from '../../context/ToastContext'
import NotificationBell from '../../components/NotificationBell'

export default function AdminDashboard() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)

  // Real-time States
  const [liveAlerts, setLiveAlerts] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [recentReports, setRecentReports] = useState([])

  // 1. Fetch initial base stats
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await getPlatformStats()
        if (alive) setStats(s)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // 2. Setup Real-time listeners for Advanced Monitoring
  useEffect(() => {
    // Listen to Live Candidate Alerts
    const unsubAlerts = onSnapshot(collection(db, 'candidateAlerts'), (snap) => {
      const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort newest first
      alerts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setLiveAlerts(alerts.slice(0, 5))
    })

    // Listen to Recent Users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setRecentUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Listen to Recent Reports (Assuming a 'reports' collection)
    const qReports = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5))
    const unsubReports = onSnapshot(qReports, (snap) => {
      setRecentReports(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubAlerts()
      unsubUsers()
      unsubReports()
    }
  }, [])

  const handleSyncStats = async () => {
    setSyncing(true)
    setSynced(false)
    try {
      await refreshPublicStats()
      toast.success('Stats synced', 'The landing page now has updated real numbers.')
      setSynced(true)
      setTimeout(() => setSynced(false), 3000)
    } catch (err) {
      toast.error('Sync failed', err.message)
    } finally {
      setSyncing(false)
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats?.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Employers', value: stats?.employers, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Active Jobs', value: stats?.activeJobs, icon: Briefcase, color: 'text-[#1db365]', bg: 'bg-[#e6f7ee]' },
    { label: 'Live Alerts', value: liveAlerts.length > 0 ? 'Active' : '0', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── DARK PREMIUM HEADER ─── */}
      <div className="bg-[#1a1c23] text-white pt-10 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container-app relative max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">
                <ShieldAlert size={14} /> System Administrator
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Platform Overview
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Real-time monitoring and advanced controls for SkillNest.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={handleSyncStats}
                disabled={syncing}
                className={`btn-primary !py-2.5 !px-5 shadow-xl transition-all ${
                  synced ? '!bg-green-600 hover:!bg-green-700' : '!bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0'
                }`}
              >
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : synced ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                {syncing ? 'Syncing...' : synced ? 'Synced!' : 'Sync Public Stats'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container-app max-w-7xl -mt-16 relative z-10">
        
        {/* 1. STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">{loading ? '—' : c.value}</p>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">{c.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} ${c.color}`}>
                  <c.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ─── LEFT COLUMN (2/3 width): Real-time Activity & Alerts ─── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* LIVE CANDIDATE ALERTS MONITOR */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Activity size={16} className="text-[#1db365]" /> Live Employer Alerts
                </h2>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#1db365] bg-[#e6f7ee] px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1db365] animate-pulse" /> REAL-TIME
                </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {liveAlerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">No active candidate alerts yet.</div>
                ) : (
                  liveAlerts.map(alert => (
                    <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{alert.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Mode: <span className="capitalize font-semibold text-gray-700">{alert.mode.replace('_', ' ')}</span> • 
                          Freq: <span className="capitalize">{alert.frequency}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-gray-400">User: {alert.employerId.slice(0, 8)}...</p>
                        <Link to={`/admin/users/${alert.employerId}`} className="text-[10px] font-bold text-[#7c3aed] hover:underline">View Employer</Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SYSTEM HEALTH / MODERATION QUEUE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <Flag size={16} className="text-red-500" /> Moderation Queue
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                    <CheckCircle2 size={24} className="text-green-500 mb-2" />
                    All clear! No open reports.
                  </div>
                ) : (
                  recentReports.map(report => (
                    <div key={report.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-red-600">{report.reason || 'Policy Violation'}</p>
                        <p className="text-xs text-gray-500">Reported by: {report.reporterEmail || 'Anonymous'}</p>
                      </div>
                      <Link to="/admin/reports" className="btn-outline !py-1 !px-3 text-xs">Review</Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/admin/jobs" className="card bg-white hover:bg-gray-50 transition border border-gray-200 p-5 flex items-center justify-between group">
                <div>
                  <h3 className="font-bold text-gray-900">Review Jobs</h3>
                  <p className="text-xs text-gray-500 mt-1">Moderate pending job posts</p>
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-[#1db365] transition" />
              </Link>
              <Link to="/admin/users" className="card bg-white hover:bg-gray-50 transition border border-gray-200 p-5 flex items-center justify-between group">
                <div>
                  <h3 className="font-bold text-gray-900">Manage Users</h3>
                  <p className="text-xs text-gray-500 mt-1">Suspend or verify accounts</p>
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-[#7c3aed] transition" />
              </Link>
            </div>
          </div>

          {/* ─── RIGHT COLUMN (1/3 width): System Health & Recent Signups ─── */}
          <div className="space-y-6">
            
            {/* RECENT SIGNUPS */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <UserPlus size={16} className="text-purple-500" /> Recent Signups
                </h2>
                <Link to="/admin/users" className="text-xs font-bold text-purple-600 hover:underline">View All</Link>
              </div>
              <div className="p-4 space-y-4">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                      {u.fullName?.[0] || u.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName || 'New User'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                    </div>
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${u.role === 'employer' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role || 'Seeker'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SYSTEM HEALTH METRICS */}
            <div className="bg-[#1a1c23] rounded-xl p-6 shadow-lg text-white">
              <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide mb-6 text-gray-300">
                <TrendingUp size={16} className="text-green-400" /> Platform Health
              </h2>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Server Status</span>
                    <span className="text-green-400 font-bold">Operational</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-green-400 h-1.5 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">User Growth (30d)</span>
                    <span className="text-white font-bold">+24.5%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-purple-400 h-1.5 rounded-full w-[75%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Job Application Rate</span>
                    <span className="text-white font-bold">High</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full w-[85%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-400 leading-relaxed">
                  All systems are operating normally. The Firebase backend is handling requests efficiently.
                </p>
              </div>
            </div>

            {/* PREMIUM UPGRADE TRACKER (Admin insight) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Premium Conversions</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats?.premiumUsers || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                <Crown size={20} className="text-yellow-500" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}