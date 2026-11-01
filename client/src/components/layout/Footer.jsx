import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Send,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
  FaTiktok,
} from 'react-icons/fa'

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useToast } from '../../context/ToastContext'
import { getLandingConfig } from '../../services/landingService'

const SOCIAL_ICONS = {
  facebook: FaFacebook,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
}

const MINI_FAQS = [
  {
    q: 'Is SkillNest free?',
    a: 'Yes, SkillNest is 100% free for job seekers to search, apply, and build a CV. Employers can also post jobs for free.',
  },
  {
    q: 'How do I avoid job scams?',
    a: 'We verify all employers. Never pay money for a job application or interview. Report suspicious listings immediately.',
  },
  {
    q: 'Which states does SkillNest cover?',
    a: 'We cover all 36 states in Nigeria plus the FCT (Abuja).',
  },
]

export default function Footer() {
  const toast = useToast()
  const [config, setConfig] = useState(null)
  const [email, setEmail] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const c = await getLandingConfig()
      if (alive) setConfig(c)
    })()
    return () => {
      alive = false
    }
  }, [])

  const aboutText =
    config?.footerAbout ||
    "SkillNest is Nigeria's trusted job platform — find verified job vacancies across Lagos, Abuja, Port Harcourt and all 36 states."
  const socials =
    config?.footerSocials || {
      facebook: '#',
      twitter: '#',
      linkedin: '#',
      instagram: '#',
      youtube: '#',
      tiktok: '#',
    }
  const tags =
    config?.footerTags || [
      'Remote Jobs',
      'NGO Jobs',
      'Graduate Trainee',
      'Entry Level',
    ]

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim() || !agree) return

    setLoading(true)
    try {
      const q = query(
        collection(db, 'newsletterSubscribers'),
        where('email', '==', email.trim().toLowerCase())
      )
      const snap = await getDocs(q)

      if (!snap.empty) {
        toast.info('Already subscribed', 'You are already on the list!')
        setSubscribed(true)
        setLoading(false)
        return
      }

      await addDoc(collection(db, 'newsletterSubscribers'), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        source: 'footer',
      })

      toast.success('Subscribed!', 'You will now receive daily job alerts.')
      setSubscribed(true)
      setEmail('')
      setAgree(false)
    } catch (err) {
      toast.error('Subscription failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-gray-950 text-gray-300 pt-16 pb-8 border-t border-gray-800 mt-auto">
      <div className="container-app">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          {/* Column 1: Brand & Socials */}
          <div className="lg:col-span-3">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              
              {/* ─── YOUR LOGO GOES HERE ─── */}
              <img 
                src="/logo.png" 
                alt="SkillNest" 
                className="w-10 h-10 object-contain rounded-xl" 
              />
              <span className="text-xl font-extrabold text-white">SkillNest</span>

            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              {aboutText}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socials).map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key]
                if (!Icon || !url || url === '#') return null
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 hover:border-green-600 transition"
                  >
                    <Icon size={16} />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Column 2: Job Seekers */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              For Job Seekers
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { l: 'Browse All Jobs', to: '/jobs' },
                { l: 'Free CV Builder', to: '/resume' },
                { l: 'Free Job Alerts', to: '/searches' },
                { l: 'My Applications', to: '/applications' },
                { l: 'Saved Jobs', to: '/saved-jobs' },
                { l: 'Sign In / Register', to: '/login' },
                { l: 'Safety Tips', to: '/security' },
                { l: 'FAQ', to: '/help' },
              ].map((link) => (
                <li key={link.l}>
                  <Link
                    to={link.to}
                    className="hover:text-green-400 transition-colors"
                  >
                    {link.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Employers */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              For Employers
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { l: 'Post a Free Job', to: '/register' },
                { l: 'Employer Dashboard', to: '/dashboard/employer' },
                { l: 'Pricing & Plans', to: '/pricing' },
                { l: 'Company Directory', to: '/companies' },
                { l: 'Advertise with us', to: '/advertise' },
              ].map((link) => (
                <li key={link.l}>
                  <Link
                    to={link.to}
                    className="hover:text-green-400 transition-colors"
                  >
                    {link.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { l: 'About Us', to: '/about' },
                { l: 'Contact Us', to: '/contact' },
                { l: 'Career Blog', to: '/blog' },
                { l: 'Help Center', to: '/help' },
                { l: 'Privacy Policy', to: '/privacy' },
                { l: 'Terms of Service', to: '/terms' },
              ].map((link) => (
                <li key={link.l}>
                  <Link
                    to={link.to}
                    className="hover:text-green-400 transition-colors"
                  >
                    {link.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Newsletter & FAQs */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
              Get Free Nigerian Job Alerts
            </h4>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Never miss a job again. Get the latest verified Nigerian vacancies
              delivered to your inbox — updated daily. No spam.
            </p>

            {subscribed ? (
              <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 flex items-start gap-3 mb-4">
                <CheckCircle2
                  className="text-green-500 mt-0.5 shrink-0"
                  size={18}
                />
                <div>
                  <p className="text-sm font-bold text-green-400">
                    You're subscribed!
                  </p>
                  <p className="text-xs text-green-500/80 mt-1">
                    Watch your inbox for new jobs.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mb-4">
                <div className="flex gap-0 rounded-lg overflow-hidden border border-gray-800 focus-within:border-green-500 transition-colors">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-gray-900 text-white px-3 py-2.5 text-sm outline-none placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={!agree || loading}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    {loading ? (
                      '...'
                    ) : (
                      <>
                        <Send size={14} /> Alert Me
                      </>
                    )}
                  </button>
                </div>

                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 accent-green-600"
                  />
                  <span className="text-[10px] text-gray-500 leading-tight">
                    I agree to receive free job alert emails from SkillNest. I
                    can unsubscribe anytime.
                  </span>
                </label>
              </form>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-green-500 font-semibold mb-6">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} /> No spam, ever.
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} /> NDPR compliant.
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} /> Free to apply.
              </span>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map((t) => (
                <Link
                  key={t}
                  to={`/jobs?q=${encodeURIComponent(t)}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-300 text-[11px] font-medium px-2.5 py-1 rounded-full transition"
                >
                  {t}
                </Link>
              ))}
            </div>

            {/* Mini FAQs */}
            <div className="border-t border-gray-800 pt-4 space-y-3">
              {MINI_FAQS.map((faq, i) => (
                <div key={i} className="border-b border-gray-800/50 pb-2">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-white hover:text-green-400 transition"
                  >
                    {faq.q}
                    {openFaq === i ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {openFaq === i && (
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} SkillNest. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link to="/security" className="hover:text-white transition">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}