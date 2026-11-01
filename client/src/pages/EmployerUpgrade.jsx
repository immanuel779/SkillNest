import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Crown,
  Zap,
  ShieldCheck,
  Users,
  Search,
  FileText,
  ChevronDown,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// YOUR PAYSTACK PUBLIC KEY GOES HERE
const PAYSTACK_PUBLIC_KEY = 'pk_live_279c98242a3ed48cf4a5e266005fe76d53db0ecb'

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', months: 1, discount: 0 },
  { id: 'quarterly', label: 'Quarterly', months: 3, discount: 0.1, badge: 'Save 1 month' },
  { id: 'biannual', label: '6 Months', months: 6, discount: 0.15, badge: '1 mo free' },
  { id: 'yearly', label: 'Yearly', months: 12, discount: 0.2, badge: '2 mo free', best: true },
]

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    desc: 'Post jobs and receive applications at no cost.',
    features: [
      { text: 'Post up to 1 active job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: 'View up to 10 applications per job', included: true },
      { text: 'Browse & shortlist candidates', included: true },
      { text: '1 phone-number reveal / 24h', included: true },
      { text: 'Resume access after shortlisting', included: true },
      { text: 'Company profile & verification', included: true },
      { text: 'More active job posts', included: false },
      { text: 'Application views beyond 10', included: false },
      { text: 'CV downloads', included: false },
    ]
  },
  {
    id: 'standard',
    name: 'Standard',
    priceMonthly: 9999,
    desc: 'Start hiring with room to grow.',
    features: [
      { text: 'Up to 3 active job posts', included: true },
      { text: 'View up to 10 applications per job', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: 'Browse & shortlist candidates', included: true },
      { text: 'Resume access after shortlisting', included: true },
      { text: 'Company profile & verification', included: true },
      { text: '3 contact reveals / day', included: true },
      { text: 'Email support (48h)', included: true },
      { text: 'Instant resume access', included: false },
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 17999,
    desc: 'More posts and CV access for active hiring.',
    features: [
      { text: 'Up to 6 active job posts', included: true },
      { text: 'View up to 10 applications per job', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: 'Browse & shortlist candidates', included: true },
      { text: 'Resume access after shortlisting', included: true },
      { text: 'Company profile & verification', included: true },
      { text: '5 contact reveals / day', included: true },
      { text: 'Priority email support (24h)', included: true },
      { text: 'Instant resume access', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 29999,
    desc: 'Urgent posts, instant resume access, 10 contact reveals a day.',
    badge: 'Best Value',
    features: [
      { text: 'Up to 12 active job posts', included: true },
      { text: 'Unlimited application views', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: 'Browse & shortlist candidates', included: true },
      { text: 'Instant resume access', included: true },
      { text: '10 contact reveals / day', included: true },
      { text: 'Daily talent alerts with AI', included: true },
      { text: '1 Urgent job slot', included: true },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 49999,
    desc: 'Zero limits. Every application in your inbox.',
    badge: 'Unlimited',
    features: [
      { text: 'Unlimited active job posts', included: true },
      { text: 'Unlimited application views', included: true },
      { text: 'Unlimited CV downloads', included: true },
      { text: 'Company profile & verification', included: true },
      { text: 'Instant resume access', included: true },
      { text: 'Unlimited contact reveals', included: true },
      { text: 'Dedicated account support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Shortlist/reject via email', included: true },
    ]
  }
]

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes, our Free plan is forever free and allows you to post 1 active job and receive applications.' },
  { q: 'How does billing work?', a: 'You are billed upfront based on the cycle you choose. Your plan will automatically renew unless cancelled.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major debit/credit cards, bank transfers, and USSD via Paystack.' },
  { q: 'How do contact reveals work?', a: 'Contact reveals let you see the email and phone number of a candidate. Once revealed, it is permanently unlocked for your team.' },
  { q: 'What is AI Match Scoring?', a: 'Our AI analyzes your job description against candidate profiles to give you a 0-100% match score, saving you hours of screening.' },
  { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time from your dashboard.' },
]

export default function EmployerUpgrade() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [cycle, setCycle] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)
  const [payingId, setPayingId] = useState(null)
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  // Load Paystack Script dynamically
  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => setPaystackLoaded(true)
    document.body.appendChild(script)
  }, [])

  const calculatePrice = (basePrice) => {
    const activeCycle = BILLING_CYCLES.find(c => c.id === cycle)
    const total = basePrice * activeCycle.months
    const discount = total * activeCycle.discount
    return Math.round(total - discount)
  }

  // Helper function to process database updates safely
  const processSuccessfulPayment = async (response, plan, currentCycle) => {
    try {
      const expiresAt = new Date()
      const activeCycle = BILLING_CYCLES.find(c => c.id === currentCycle)
      expiresAt.setMonth(expiresAt.getMonth() + activeCycle.months)

      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        subscriptionPlan: plan.name,
        subscriptionCycle: currentCycle,
        subscriptionExpiresAt: expiresAt,
        lastPaymentRef: response.reference,
        lastPaymentAt: serverTimestamp()
      })

      toast.success('Payment Successful!', `You are now on the ${plan.name} plan.`)
      navigate('/dashboard/employer')
    } catch (err) {
      toast.error('Database update failed', err.message)
    } finally {
      setPayingId(null)
    }
  }

  const handleSubscribe = (plan) => {
    if (plan.id === 'free') return toast.info('You are already on the Free plan.')
    if (!paystackLoaded) return toast.error('Payment system loading, please wait.')

    const finalPrice = calculatePrice(plan.priceMonthly)
    setPayingId(plan.id)

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: finalPrice * 100, // Paystack uses kobo
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
          { display_name: "Cycle", variable_name: "cycle", value: cycle }
        ]
      },
      // 🚨 FIXED: Using standard function syntax
      callback: function(response) {
        processSuccessfulPayment(response, plan, cycle)
      },
      onClose: function() {
        toast.info('Payment cancelled.')
        setPayingId(null)
      }
    })
    handler.openIframe()
  }

  return (
    <div className="bg-gray-50/50 min-h-screen pb-24 font-sans">
      
      {/* DARK HERO SECTION */}
      <div className="bg-[#0f172a] text-white pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container-app relative text-center max-w-3xl z-10">
          <span className="text-brand-400 font-bold tracking-widest uppercase text-xs mb-3 block">• Transparent Pricing •</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Plans built for <br /> <span className="text-brand-400">Nigerian hiring</span>
          </h1>
          <p className="mt-4 text-gray-400 text-lg">
            Start free. Upgrade when you're ready. No lock-ins — cancel anytime.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs font-semibold text-gray-300">
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> Free to start</span>
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> No setup fees</span>
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> Cancel anytime</span>
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-400"/> Pay in Naira</span>
          </div>
        </div>
      </div>

      <div className="container-app max-w-7xl relative z-20 -mt-16">
        
        {/* BILLING CYCLE TOGGLE */}
        <div className="flex flex-col items-center mb-10">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Choose your billing cycle</p>
          <div className="bg-white rounded-2xl p-1.5 shadow-xl border border-gray-100 flex flex-wrap justify-center gap-1">
            {BILLING_CYCLES.map(c => (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`relative px-5 py-3 rounded-xl text-sm font-bold transition-all flex flex-col items-center min-w-[100px] ${
                  cycle === c.id ? 'bg-[#0f172a] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>{c.label}</span>
                {c.badge && (
                  <span className={`text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded ${
                    cycle === c.id ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-700'
                  }`}>{c.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* FEATURE HIGHLIGHTS BAR */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Zap size={18} className="text-blue-600"/></div>
            <div>
              <p className="font-bold text-sm text-gray-900">AI Match Scoring</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Enterprise employers get 0-100% match scores on candidates.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><Search size={18} className="text-green-600"/></div>
            <div>
              <p className="font-bold text-sm text-gray-900">Unlimited Contact Reveals</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Enterprise sees phone + email directly with no pipeline step.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0"><FileText size={18} className="text-orange-600"/></div>
            <div>
              <p className="font-bold text-sm text-gray-900">Instant Resume Access</p>
              <p className="text-[11px] text-gray-500 mt-0.5">View CVs the moment you open a profile (Premium+).</p>
            </div>
          </div>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-4 items-start">
          {PLANS.map(plan => {
            const activeCycle = BILLING_CYCLES.find(c => c.id === cycle)
            const price = plan.priceMonthly === 0 ? 0 : calculatePrice(plan.priceMonthly)
            const isPremium = plan.id === 'premium'
            const isEnterprise = plan.id === 'enterprise'

            return (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-2xl border flex flex-col h-full transition hover:shadow-xl
                  ${isPremium ? 'border-brand-500 shadow-lg ring-1 ring-brand-500' : 'border-gray-200 shadow-sm'}
                  ${isEnterprise ? 'border-blue-600 shadow-lg ring-1 ring-blue-600' : ''}
                `}
              >
                {isPremium && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Best Value</div>}
                {isEnterprise && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Unlimited</div>}
                
                <div className="p-5 border-b border-gray-100 flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                  
                  <div className="mt-3 flex items-baseline gap-1">
                    {price === 0 ? (
                      <span className="text-4xl font-extrabold text-gray-900">Free</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-gray-500">₦</span>
                        <span className="text-3xl font-extrabold text-gray-900">{price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 font-medium">/{cycle === 'monthly' ? 'mo' : cycle}</span>
                      </>
                    )}
                  </div>
                  
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed min-h-[32px]">{plan.desc}</p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {f.included ? (
                          <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X size={14} className="text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-[11px] leading-tight ${f.included ? 'text-gray-700' : 'text-gray-400'}`}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-b-2xl">
                  {plan.id === 'free' ? (
                     <button disabled className="w-full py-2.5 rounded-lg text-sm font-bold bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-1.5">
                       <Check size={14}/> Current Plan
                     </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe(plan)}
                      disabled={payingId === plan.id}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition ${
                        isEnterprise ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' :
                        isPremium ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md hover:shadow-lg' :
                        'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      {payingId === plan.id ? 'Processing...' : (
                        <>
                          <Crown size={14}/> Get {plan.name} — ₦{price.toLocaleString()}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* HIRING AT SCALE */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Building2 size={18} className="text-brand-600"/> Hiring at scale?</h3>
            <p className="text-xs text-gray-500 mt-1">Agencies and large teams: talk to us about custom volume hiring.</p>
          </div>
          <a href="mailto:opeyemioluwadamilare415@gmail.com" className="btn-outline !py-2.5 !px-6 text-sm !bg-gray-900 !text-white !border-gray-900 hover:!bg-black shrink-0">
            Contact Sales
          </a>
        </div>

        {/* FAQ SECTION */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Common Questions</h2>
            <p className="text-sm text-gray-500 mt-1">Everything you need to know before subscribing.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-gray-800 text-sm hover:bg-gray-50 transition"
                >
                  {faq.q}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* STICKY BOTTOM BANNER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
        <div className="container-app max-w-7xl py-3 flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="font-bold text-gray-900 text-sm">No contracts. Cancel anytime.</p>
            <p className="text-xs text-gray-500 mt-0.5">Your free account and data are always yours.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={() => handleSubscribe(PLANS[3])} className="flex-1 sm:flex-none btn-primary !bg-brand-600 !py-2 !px-5 text-sm shadow-md">
                <Crown size={14}/> Get Premium — ₦29,999 /mo
             </button>
             <Link to="/dashboard/employer" className="flex-1 sm:flex-none btn-outline !py-2 !px-4 text-sm !bg-gray-50 text-center">
                <ArrowRight size={14} className="inline mr-1"/> Dashboard
             </Link>
          </div>
        </div>
      </div>

    </div>
  )
}