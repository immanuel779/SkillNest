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
    awaiting_payment_confirmation: {
  label: 'Payment confirming',
  cls: 'bg-blue-50 text-blue-700 border-blue-200',
  icon: Clock,
},
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

  useEffect(() => {
    seedAdPackages()
  }, [])

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
    <div className="container-app py-10 max-w-6xl">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="badge bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-900">
          <Megaphone size={12} /> Advertise with SkillNest
        </span>
        <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold text-balance">
          Reach thousands of{' '}
          <span className="gradient-text-brand">Nigerian job seekers</span>
        </h1>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
          Promote your brand, product, or service to a verified audience of
          professionals, graduates, and employers across all 36 states.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {[
          { icon: Users, label: 'Monthly reach', value: '10k+' },
          { icon: Target, label: 'Verified users', value: '100%' },
          { icon: TrendingUp, label: 'Engagement rate', value: '12%' },
          { icon: Megaphone, label: 'Ad formats', value: '4+ types' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-3">
              <s.icon size={18} className="text-brand-700 dark:text-brand-400" />
            </div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Packages */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge bg-accent-50 text-accent-700 border border-accent-100 dark:bg-accent-950 dark:text-accent-300 dark:border-accent-900">
          <Sparkles size={12} /> Pricing
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">
          Choose your plan
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Simple, transparent pricing. No hidden fees.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-gray-100 dark:border-gray-800 h-96 animate-pulse bg-gray-50 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {packages.map((pkg) => (
            <AdPackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selected?.id === pkg.id}
              onSelect={handleSelectPackage}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="mb-14">
        <h3 className="text-2xl font-bold text-center mb-8">
          How it works
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              n: 1,
              t: 'Choose your plan',
              d: 'Pick the package that fits your budget and goals.',
            },
            {
              n: 2,
              t: 'Submit your ad',
              d: 'Fill in your headline, logo, and CTA. Takes 3 minutes.',
            },
            {
              n: 3,
              t: 'We review it',
              d: 'Our team approves within 24 hours. Payment on approval.',
            },
            {
              n: 4,
              t: 'Go live',
              d: 'Your ad appears on the landing page and dashboards.',
            },
          ].map((step) => (
            <div key={step.n} className="card">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center mb-3">
                {step.n}
              </div>
              <p className="font-bold">{step.t}</p>
              <p className="text-sm text-gray-500 mt-1">{step.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My submissions */}
      {user && submissions.length > 0 && (
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">My ad submissions</h3>
            <button
              onClick={loadMySubmissions}
              className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
            >
              Refresh
            </button>
          </div>
          <div className="grid gap-3">
            {submissions.map((s) => {
              const meta = STATUS_STYLES[s.status] || STATUS_STYLES.pending
              const Icon = meta.icon
              return (
                <div key={s.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-full sm:w-32 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {s.logoUrl ? (
                        <img
                          src={s.logoUrl}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Megaphone size={28} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold truncate">{s.headline}</h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 border ${meta.cls}`}
                        >
                          <Icon size={10} /> {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {s.businessName} · {s.packageName} · ₦
                        {Number(s.price || 0).toLocaleString()}
                      </p>
                      {s.status === 'rejected' && s.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {s.rejectionReason}
                        </p>
                      )}
                      {s.status === 'approved' && (
                        <p className="text-xs text-green-700 mt-1">
                          {s.views || 0} views · {s.clicks || 0} clicks
                        </p>
                      )}
                    </div>
                    <a
                      href={s.ctaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline !py-2 !px-3 text-xs shrink-0"
                    >
                      Preview <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA for non-signed users */}
      {!user && (
        <div className="card text-center py-12 bg-gradient-to-br from-brand-50 to-accent-50/40 dark:from-brand-950/60 dark:to-gray-900 border-brand-100 dark:border-brand-900">
          <Megaphone size={36} className="mx-auto text-brand-600 mb-3" />
          <h3 className="text-2xl font-extrabold">Ready to advertise?</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
            Sign in or create an account to submit your ad.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/register" className="btn-primary">
              Create account <ArrowRight size={14} />
            </Link>
            <Link to="/login" className="btn-outline">
              Sign in
            </Link>
          </div>
        </div>
      )}

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