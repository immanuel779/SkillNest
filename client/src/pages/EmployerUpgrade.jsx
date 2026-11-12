import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  X,
  Crown,
  Zap,
  Users,
  Search,
  FileText,
  ChevronDown,
  Building2,
  ArrowRight,
  ShieldCheck,
  Star,
  HelpCircle,
  TrendingUp,
  Lock
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// YOUR PAYSTACK PUBLIC KEY GOES HERE
const PAYSTACK_PUBLIC_KEY = 'pk_live_279c98242a3ed48cf4a5e266005fe76d53db0ecb'
const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', months: 1, discount: 0 },
  { id: 'quarterly', label: 'Quarterly', months: 3, discount: 0.1, badge: 'Save 10%' },
  { id: 'biannual', label: '6 Months', months: 6, discount: 0.15, badge: 'Save 15%' },
  { id: 'yearly', label: 'Yearly', months: 12, discount: 0.2, badge: 'Best Offer', best: true },
]

const PLANS = [
  {
    id: 'free',
    name: 'Free Tier',
    priceMonthly: 0,
    desc: 'Limited access to test the platform. Upgrade to actually hire.',
    features: [
      { text: 'Post up to 1 active job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: 'View up to 10 applications per job', included: true },
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
    desc: 'Perfect for small businesses making their first few hires.',
    features: [
      { text: 'Up to 3 active job posts', included: true },
      { text: 'View up to 10 applications per job', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
      { text: 'Receive & manage applications', included: true },
      { text: '3 contact reveals / day', included: true },
      { text: 'Email support (48h)', included: true },
      { text: 'Instant resume access', included: false },
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 17999,
    desc: 'For active hiring managers who need more volume.',
    features: [
      { text: 'Up to 6 active job posts', included: true },
      { text: 'View up to 10 applications per job', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
      { text: '5 contact reveals / day', included: true },
      { text: 'Priority email support (24h)', included: true },
      { text: 'Instant resume access', included: false },
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 29999,
    desc: 'Urgent posts, AI matching, and instant resume access.',
    badge: 'Most Popular',
    features: [
      { text: 'Up to 12 active job posts', included: true },
      { text: 'Unlimited application views', included: true },
      { text: 'Up to 10 CV downloads per job', included: true },
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
    desc: 'Zero limits. Every application, CV, and contact in your inbox.',
    badge: 'Unlimited',
    features: [
      { text: 'Unlimited active job posts', included: true },
      { text: 'Unlimited application views', included: true },
      { text: 'Unlimited CV downloads', included: true },
      { text: 'Instant resume access', included: true },
      { text: 'Unlimited contact reveals', included: true },
      { text: 'Dedicated account support', included: true },
      { text: 'Early access to new features', included: true },
    ]
  }
]

const FAQS = [
  { 
    q: 'Is the Free plan really free forever?', 
    a: 'No. The Free tier is designed for you to test the platform. It limits you to 1 active job and restricts CV downloads. Only the SkillNest Admin and the official SkillNest Company account have unrestricted, forever-free access to the entire platform. Employers must upgrade to a paid plan to unlock full hiring capabilities.' 
  },
  { 
    q: 'Why should I upgrade from the Free tier?', 
    a: 'Top candidates get hired in days. On the Free tier, you can only post 1 job and view 10 applications. Upgrading to Premium or Enterprise allows you to post more jobs, download CVs instantly, and reveal contact details so you can reach out to candidates before your competitors do.' 
  },
  { 
    q: 'How does billing work?', 
    a: 'You are billed upfront based on the cycle you choose (Monthly, Quarterly, etc.). Your plan will automatically renew unless cancelled. You can cancel anytime from your dashboard with no hidden fees.' 
  },
  { 
    q: 'What payment methods do you accept?', 
    a: 'We accept all major debit/credit cards, bank transfers, and USSD via Paystack. Your payment information is securely processed by Paystack; we do not store your card details.' 
  },
  { 
    q: 'How do contact reveals work?', 
    a: 'Contact reveals let you see the email and phone number of a candidate. Once revealed, it is permanently unlocked for your team. Standard gets 3/day, Premium gets 10/day, and Enterprise gets unlimited.' 
  },
  { 
    q: 'What is AI Match Scoring?', 
    a: 'Our AI analyzes your job description against candidate profiles to give you a 0-100% match score. This feature is exclusive to Enterprise users and saves you hours of manual screening.' 
  },
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
      navigate('/employer/dashboard')
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
          <span className="text-brand-400 font-bold tracking-widest uppercase text-xs mb-3 block">• Competitive Pricing •</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Stop losing top talent to <br /> <span className="text-brand-400">slow hiring</span>
          </h1>
          <p className="mt-4 text-gray-400 text-lg">
            Upgrade to unlock unlimited job posts, instant CV downloads, and direct contact reveals. 
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8 text-xs font-semibold text-gray-300">
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><ShieldCheck size={14} className="text-green-400"/> Secure Paystack Checkout</span>
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><Zap size={14} className="text-yellow-400"/> Instant Activation</span>
             <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"><Lock size={14} className="text-blue-400"/> Cancel Anytime</span>
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

        {/* PRICING CARDS GRID */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 gap-4 items-start">
          {PLANS.map(plan => {
            const price = plan.priceMonthly === 0 ? 0 : calculatePrice(plan.priceMonthly)
            const isPremium = plan.id === 'premium'
            const isEnterprise = plan.id === 'enterprise'
            const isFree = plan.id === 'free'

            return (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-2xl border flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                  ${isPremium ? 'border-brand-500 shadow-lg ring-2 ring-brand-500 scale-105 z-10' : 'border-gray-200 shadow-sm'}
                  ${isEnterprise ? 'border-blue-600 shadow-lg ring-1 ring-blue-600' : ''}
                  ${isFree ? 'opacity-80 hover:opacity-100' : ''}
                `}
              >
                {isPremium && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">Most Popular</div>}
                {isEnterprise && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">Unlimited</div>}
                
                <div className="p-5 border-b border-gray-100 flex-1">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center justify-between">
                    {plan.name}
                    {isFree && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">LIMITED</span>}
                  </h3>
                  
                  <div className="mt-3 flex items-baseline gap-1">
                    {price === 0 ? (
                      <span className="text-4xl font-extrabold text-gray-900">₦0</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-gray-500">₦</span>
                        <span className="text-3xl font-extrabold text-gray-900">{price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 font-medium">/{cycle === 'monthly' ? 'mo' : cycle}</span>
                      </>
                    )}
                  </div>
                  
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed min-h-[40px]">{plan.desc}</p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {f.included ? (
                          <Check size={14} className={`shrink-0 mt-0.5 ${isPremium || isEnterprise ? 'text-brand-500' : 'text-green-500'}`} />
                        ) : (
                          <X size={14} className="text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-[11px] leading-tight ${f.included ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-b-2xl">
                  {isFree ? (
                     <button disabled className="w-full py-2.5 rounded-lg text-sm font-bold bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-1.5">
                       Current Plan
                     </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe(plan)}
                      disabled={payingId === plan.id}
                      className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        isEnterprise ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' :
                        isPremium ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:shadow-lg' :
                        'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      {payingId === plan.id ? 'Processing...' : (
                        <>
                          <Crown size={14}/> Select {plan.name}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* WHY UPGRADE MATRIX */}
        <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
              <TrendingUp className="text-brand-600" /> Why Employers Upgrade
            </h3>
            <p className="text-sm text-gray-500 mt-1">The cost of missing a top candidate is far higher than a subscription.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3"><Zap size={20} className="text-green-600"/></div>
              <h4 className="font-bold text-gray-900 text-sm">Speed to Hire</h4>
              <p className="text-xs text-gray-600 mt-1">Free users wait for candidates to apply. Premium users download CVs and reveal contact info instantly, beating other companies to the punch.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3"><Users size={20} className="text-blue-600"/></div>
              <h4 className="font-bold text-gray-900 text-sm">Volume Hiring</h4>
              <p className="text-xs text-gray-600 mt-1">If you have more than 1 role to fill, the Free tier will block you. Standard and Professional plans allow you to run multiple pipelines at once.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3"><Search size={20} className="text-purple-600"/></div>
              <h4 className="font-bold text-gray-900 text-sm">AI Candidate Matching</h4>
              <p className="text-xs text-gray-600 mt-1">Stop reading 100s of unqualified CVs. Enterprise AI scoring ranks your applicants from 0-100% so you only interview the best.</p>
            </div>
          </div>
        </div>

        {/* FAQ SECTION (UPGRADED) */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
               <HelpCircle className="text-brand-600" /> Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500 mt-1">Everything you need to know before subscribing.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${openFaq === i ? 'border-brand-300 ring-1 ring-brand-100' : 'border-gray-200'}`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-gray-800 text-sm hover:bg-gray-50 transition gap-4"
                >
                  <span className="flex-1">{faq.q}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === i ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-gray-50/50">
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
            <p className="font-bold text-gray-900 text-sm">Ready to hire faster?</p>
            <p className="text-xs text-gray-500 mt-0.5">Join thousands of Nigerian employers finding top talent.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={() => handleSubscribe(PLANS[3])} className="flex-1 sm:flex-none btn-primary !bg-brand-600 !py-2.5 !px-6 text-sm shadow-md hover:!bg-brand-700 transition active:scale-95">
                <Crown size={16}/> Get Premium — ₦29,999 /mo
             </button>
             <Link to="/employer/dashboard" className="flex-1 sm:flex-none btn-outline !py-2.5 !px-4 text-sm !bg-gray-50 text-center hover:!bg-gray-100">
                Dashboard
             </Link>
          </div>
        </div>
      </div>

    </div>
  )
}