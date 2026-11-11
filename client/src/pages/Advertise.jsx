import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  listAdPackages,
  seedAdPackages,
  listMyAdSubmissions,
} from '../services/adsService'
import AdPackageCard from '../components/ads/AdPackageCard'
import AdSubmissionForm from '../components/ads/AdSubmissionForm'
import PaymentInstructionsModal from '../components/ads/PaymentInstructionsModal'

const STATUS_STYLES = {
  pending: {
    label: 'Pending review',
    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  approved: {
    label: 'Live',
    cls: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Needs changes',
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  expired: {
    label: 'Expired',
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Clock,
  },
  awaiting_payment_confirmation: {
    label: 'Payment confirming',
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
}

export default function Advertise() {
  const { user, profile } = useAuth()
  const [packages, setPackages] = useState([])
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentSubmission, setPaymentSubmission] = useState(null)

  // 👇 FIXED: Only Admin can trigger the database seed to prevent permission errors
  useEffect(() => {
    if (profile?.role === 'admin') {
      seedAdPackages()
    }
  }, [profile])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const pkgs = await listAdPackages()
      if (alive) {
        setPackages(pkgs)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const loadMySubmissions = async () => {
    if (!user) return
    const list = await listMyAdSubmissions(user.uid)
    setSubmissions(list)
  }

  useEffect(() => {
    loadMySubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSelectPackage = (pkg) => {
    if (!user) {
      window.location.href = '/login'
      return
    }
    setSelected(pkg)
    setShowForm(true)
  }

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20 font-sans">
      
      {/* ─── DARK HERO SECTION ─── */}
      <div className="bg-[#0f172a] text-white pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#7c3aed]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container-app relative text-center max-w-3xl z-10">
          <span className="inline-flex items-center gap-1.5 text-[#7c3aed] bg-[#7c3aed]/10 border border-[#7c3aed]/20 font-bold tracking-widest uppercase text-xs mb-5 px-4 py-1.5 rounded-full">
            <Megaphone size={14} /> Advertise with SkillNest
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Reach thousands of <br /> <span className="text-[#7c3aed]">Nigerian professionals</span>
          </h1>
          <p className="mt-5 text-gray-400 text-lg max-w-2xl mx-auto">
            Promote your brand, product, or service directly to a verified audience of job seekers, graduates, and employers across all 36 states.
          </p>
        </div>
      </div>

      <div className="container-app max-w-6xl relative z-20 -mt-20">
        
        {/* ─── STATS BAR ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Users, label: 'Monthly reach', value: '10k+' },
            { icon: Target, label: 'Verified users', value: '100%' },
            { icon: TrendingUp, label: 'Engagement rate', value: '12%' },
            { icon: Megaphone, label: 'Ad formats', value: '4+ types' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <s.icon size={20} className="text-[#7c3aed]" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ─── WHY ADVERTISE? (COMPETITIVE MATRIX) ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
              <Sparkles className="text-[#7c3aed]" /> Why Advertise on SkillNest?
            </h2>
            <p className="text-sm text-gray-500 mt-2">Get your brand in front of the right people at the right time.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Target className="text-blue-600" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Hyper-Targeted Audience</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Reach active job seekers, fresh graduates, and hiring managers exactly when they are looking for solutions.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-green-600" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">100% Verified Users</h3>
              <p className="text-sm text-gray-600 leading-relaxed">No bots, no fake accounts. Every user on SkillNest is authenticated, ensuring your ad budget is spent on real humans.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="text-[#7c3aed]" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Real-Time Analytics</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Track exactly how many views and clicks your ad gets. Know your ROI with our built-in dashboard analytics.</p>
            </div>
          </div>
        </div>

        {/* ─── PRICING PLANS ─── */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] uppercase tracking-widest bg-purple-50 border border-purple-100 px-3 py-1 rounded-full mb-3">
            <Zap size={12} /> Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Choose your visibility
          </h2>
          <p className="mt-3 text-gray-500">
            Simple, transparent pricing. No hidden fees.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-100 h-96 animate-pulse bg-white" />
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mb-16">
            <Megaphone size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No ad packages available right now.</p>
            <p className="text-sm text-gray-400 mt-1">Please check back later or contact support.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {packages.map((pkg) => (
              <div key={pkg.id} className="transition-transform duration-300 hover:-translate-y-2">
                <AdPackageCard
                  pkg={pkg}
                  selected={selected?.id === pkg.id}
                  onSelect={handleSelectPackage}
                />
              </div>
            ))}
          </div>
        )}

        {/* ─── HOW IT WORKS (TIMELINE) ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
              <Globe className="text-[#7c3aed]" /> How it works
            </h3>
            <p className="text-sm text-gray-500 mt-2">Get your ad live in less than 24 hours.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 z-0" />
            
            {[
              { n: 1, t: 'Choose your plan', d: 'Pick the package that fits your budget and visibility goals.' },
              { n: 2, t: 'Submit your ad', d: 'Fill in your headline, logo, and CTA link. Takes 3 minutes.' },
              { n: 3, t: 'We review it', d: 'Our team approves within 24 hours. Payment instructions sent.' },
              { n: 4, t: 'Go live', d: 'Your ad appears on the landing page and dashboards instantly.' },
            ].map((step) => (
              <div key={step.n} className="relative z-10 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center">
                <div className="w-12 h-12 rounded-full bg-[#7c3aed] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                  {step.n}
                </div>
                <p className="font-bold text-gray-900">{step.t}</p>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── MY SUBMISSIONS ─── */}
        {user && submissions.length > 0 && (
          <div className="mb-14 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-900">My Ad Campaigns</h3>
              <button
                onClick={loadMySubmissions}
                className="text-xs font-bold text-[#7c3aed] hover:underline"
              >
                Refresh List
              </button>
            </div>
            <div className="grid gap-4">
              {submissions.map((s) => {
                const meta = STATUS_STYLES[s.status] || STATUS_STYLES.pending
                const Icon = meta.icon
                return (
                  <div key={s.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-gray-50 transition">
                    <div className="w-full md:w-32 h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Megaphone size={28} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-gray-900 truncate text-base">{s.headline}</h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${meta.cls}`}>
                          <Icon size={12} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        {s.businessName} <span className="mx-1 text-gray-300">•</span> {s.packageName} <span className="mx-1 text-gray-300">•</span> ₦{Number(s.price || 0).toLocaleString()}
                      </p>
                      
                      {s.status === 'rejected' && s.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                          <strong>Reason:</strong> {s.rejectionReason}
                        </p>
                      )}
                      
                      {s.status === 'approved' && (
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                            <EyeIcon /> {s.views || 0} views
                          </p>
                          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                            <CursorClickIcon /> {s.clicks || 0} clicks
                          </p>
                        </div>
                      )}
                    </div>
                    <a
                      href={s.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline !py-2 !px-4 text-xs shrink-0 !border-gray-300 !text-gray-700 hover:!bg-gray-100"
                    >
                      Preview <ArrowRight size={14} />
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── CTA FOR GUESTS ─── */}
        {!user && (
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1a1c23] rounded-3xl p-10 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/20 rounded-full blur-3xl" />
            <Megaphone size={48} className="mx-auto text-[#7c3aed] mb-4" />
            <h3 className="text-3xl font-extrabold text-white">Ready to advertise?</h3>
            <p className="text-gray-400 mt-2 mb-8 max-w-md mx-auto">
              Sign in or create an account to submit your ad and reach thousands of candidates.
            </p>
            <div className="flex justify-center gap-4 flex-wrap relative z-10">
              <Link to="/register" className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-3 !px-8 shadow-lg shadow-[#7c3aed]/20">
                Create account <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-outline !border-white/20 !text-white hover:!bg-white/10 !py-3 !px-8">
                Sign in
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showForm && selected && (
        <AdSubmissionForm
          pkg={selected}
          onClose={() => setShowForm(false)}
          onSubmitted={(submissionId, pkg) => {
            setShowForm(false)
            setPaymentSubmission({ id: submissionId, pkg })
            loadMySubmissions()
          }}
        />
      )}

      {paymentSubmission && (
        <PaymentInstructionsModal
          submissionId={paymentSubmission.id}
          pkg={paymentSubmission.pkg}
          onClose={() => {
            setPaymentSubmission(null)
            setSelected(null)
          }}
          onConfirmed={() => {
            setPaymentSubmission(null)
            setSelected(null)
            loadMySubmissions()
          }}
        />
      )}
    </div>
  )
}

// Small helper icons for the submissions tracker
function EyeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
}

function CursorClickIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 9 5 12 1.774-5.226L21 14 9 9z"/><path d="m16.071 16.071 4.243 4.243"/><path d="m7.188 2.239.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656-2.12 2.122"/></svg>
}