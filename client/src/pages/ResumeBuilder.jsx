import { useEffect, useRef, useState, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  Save,
  Download,
  Loader2,
  FileText,
  Eye,
  Pencil,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Crown,
  Sparkles,
  Zap,
  Check,
  X,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getMyResume,
  saveMyResume,
  emptyResume,
} from '../services/resumeService'
import { getProfile } from '../services/profileService'
import { friendlyError } from '../utils/errors'
import ResumeForm from '../components/resume/ResumeForm'
import ResumePreview from '../components/resume/ResumePreview'

const A4_WIDTH_PX = 794 // 210mm at 96dpi

function ScaleToFit({ baseWidth, children }) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / baseWidth))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [baseWidth])

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <div style={{ width: baseWidth * scale, height: 'auto', margin: '0 auto' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: baseWidth }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   PREMIUM UPGRADE MODAL (With Real Paystack)
   ============================================================ */
function UpgradeModal({ onClose, onUpgrade, user, toast }) {
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Load Paystack script dynamically
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePay = () => {
    if (!window.PaystackPop) {
      toast.error('Payment system loading... please try again.')
      return
    }
    if (!user?.email) {
      toast.error('Please ensure your account has an email address.')
      return
    }

    setProcessing(true)

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: 5000 * 100, // 5,000 NGN in kobo
      currency: 'NGN',
      callback: function (response) {
        verifyPayment(response.reference)
      },
      onClose: function () {
        setProcessing(false)
        toast.info('Payment cancelled.')
      },
    })
    handler.openIframe()
  }

  const verifyPayment = async (reference) => {
    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, userId: user.uid }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      
      onUpgrade() // Unlock UI
    } catch (err) {
      toast.error('Payment failed', err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-brand-100">
        <div className="relative bg-gradient-to-br from-brand-700 to-accent-600 p-6 text-center text-white overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <button onClick={onClose} disabled={processing} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
            <X size={20} />
          </button>
          <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
            <Crown size={32} className="text-yellow-300" />
          </div>
          <h2 className="text-2xl font-extrabold">Upgrade to Pro</h2>
          <p className="text-white/80 text-sm mt-1">Stand out with premium features</p>
        </div>

        <div className="p-6">
          <ul className="space-y-3 mb-6">
            {[
              'Unlock Premium Templates (Executive & Creative)',
              'Remove the SkillNest watermark from PDF',
              'Unlimited AI Bullet rewrites',
              'Priority placement to top employers',
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">One-time payment</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">₦5,000</p>
          </div>

          <button
            onClick={handlePay}
            disabled={processing}
            className="btn-primary w-full !py-3 !text-base shadow-xl shadow-brand-500/30"
          >
            {processing ? (
              <><Loader2 size={18} className="animate-spin" /> Verifying...</>
            ) : (
              <><CreditCard size={18} /> Pay & Unlock Pro</>
            )}
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Secure checkout powered by Paystack
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResumeBuilder() {
  const { user, profile: authProfile } = useAuth()
  const toast = useToast()
  const [resume, setResume] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('edit')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isPremium = profile?.subscription === 'pro' || profile?.isPremium === true

  const printRef = useRef(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: resume?.basics?.fullName ? `${resume.basics.fullName} – Resume` : 'Resume',
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!user) {
          if (alive) setLoading(false)
          return
        }
        const [existing, profileDoc] = await Promise.all([
          getMyResume(user.uid),
          getProfile(user.uid),
        ])
        if (!alive) return
        const p = profileDoc || authProfile
        setProfile(p)
        setResume(existing || emptyResume(p))
      } catch (err) {
        console.error('Resume load failed:', err)
        if (alive) setResume(emptyResume(authProfile || {}))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user, authProfile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await saveMyResume(user.uid, resume)
      toast.success('Resume saved', 'You can come back and edit anytime.')
    } catch (err) {
      toast.error('Save failed', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeSuccess = () => {
    setShowUpgrade(false)
    setProfile((p) => ({ ...p, subscription: 'pro', isPremium: true }))
    toast.success('Welcome to Pro!', 'Payment verified. Premium templates unlocked.')
  }

  const atsScore = useMemo(() => {
    if (!resume) return { score: 0, checks: [] }
    let score = 0
    const checks = [
      { label: 'Contact info (Email & Phone)', met: !!(resume.basics?.email && resume.basics?.phone) },
      { label: 'Professional Summary (50+ chars)', met: (resume.summary?.length || 0) > 50 },
      { label: 'At least 1 Work Experience', met: resume.experience?.length > 0 },
      { label: 'Experience has 2+ bullet points', met: resume.experience?.some((x) => x.bullets?.filter((b) => b.trim()).length >= 2) },
      { label: 'At least 5 Skills listed', met: resume.skills?.length >= 5 },
      { label: 'Education added', met: resume.education?.length > 0 },
    ]
    checks.forEach((c) => { if (c.met) score += 16.6 })
    return { score: Math.round(score), checks }
  }, [resume])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-sm text-gray-500 font-medium">Loading your workspace...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-app py-20 text-center max-w-md">
        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold">Sign in to build your resume</h1>
        <p className="text-gray-500 mt-2 mb-6">Save drafts, use AI assistance, and export to PDF.</p>
        <a href="/login" className="btn-primary inline-flex">Sign In</a>
      </div>
    )
  }

  if (!resume) return null

  return (
    <div className="container-app py-4 sm:py-6 lg:py-10">
      {!isPremium && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-gray-900 via-brand-900 to-gray-900 border border-brand-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base">Unlock Premium Resumes</p>
              <p className="text-xs text-white/60">Get Executive templates, watermark removal, and more.</p>
            </div>
          </div>
          <button onClick={() => setShowUpgrade(true)} className="btn-primary !py-2 !px-5 text-sm shrink-0 whitespace-nowrap bg-gradient-to-r from-yellow-500 to-yellow-600 border-none shadow-lg shadow-yellow-500/20 text-black hover:text-white transition">
            Upgrade for ₦5,000
          </button>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
              <FileText size={22} className="text-brand-600 shrink-0" />
              <span className="truncate">Resume Builder</span>
              {isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Pro
                </span>
              )}
            </h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">
              Build a professional, ATS-friendly resume. Choose templates, colors, and fonts.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleSave} disabled={saving} className="btn-outline !py-2 !px-3 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden xs:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button onClick={handlePrint} className="btn-primary !py-2 !px-3 text-sm shadow-md">
              <Download size={14} />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden mb-4 sticky top-16 z-20 bg-gray-50/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-200">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 w-full shadow-sm">
          <button onClick={() => setTab('edit')} className={`flex-1 justify-center px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 transition ${tab === 'edit' ? 'bg-brand-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Pencil size={14} /> Edit
          </button>
          <button onClick={() => setTab('preview')} className={`flex-1 justify-center px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 transition ${tab === 'preview' ? 'bg-brand-700 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <div className={tab === 'preview' ? 'hidden lg:block min-w-0' : 'block min-w-0'}>
          <ResumeForm
            resume={resume}
            setResume={setResume}
            profile={profile}
            isPremium={isPremium}
            onUpgradeClick={() => setShowUpgrade(true)}
          />
        </div>

        <div className={tab === 'edit' ? 'hidden lg:block min-w-0' : 'block min-w-0'}>
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="card bg-gradient-to-br from-gray-900 to-black text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent-400" />
                  <h3 className="font-bold">ATS Match Score</h3>
                </div>
                <span className={`text-2xl font-extrabold ${atsScore.score >= 80 ? 'text-green-400' : atsScore.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {atsScore.score}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${atsScore.score >= 80 ? 'bg-green-500' : atsScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${atsScore.score}%` }}
                />
              </div>
              <ul className="space-y-2.5">
                {atsScore.checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {c.met ? <CheckCircle2 size={15} className="text-green-400 mt-0.5 shrink-0" /> : <AlertCircle size={15} className="text-gray-500 mt-0.5 shrink-0" />}
                    <span className={c.met ? 'text-gray-300 line-through decoration-gray-600' : 'text-white/80'}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Live preview</p>
                {!isPremium && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">BASIC</span>}
                {isPremium && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200">PRO UNLOCKED</span>}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-100 p-2 sm:p-3 lg:p-4 shadow-inner">
                <ScaleToFit baseWidth={A4_WIDTH_PX}>
                  <div className="bg-white shadow-xl">
                    <ResumePreview ref={printRef} resume={resume} isPremium={isPremium} />
                  </div>
                </ScaleToFit>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <ResumePreview ref={printRef} resume={resume} isPremium={isPremium} />
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onUpgrade={handleUpgradeSuccess}
          user={user}
          toast={toast}
        />
      )}
    </div>
  )
}