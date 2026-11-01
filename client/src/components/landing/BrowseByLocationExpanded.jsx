import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react'

/* ============================================================
   ALL 36 NIGERIAN STATES + FCT
   ============================================================ */
const ALL_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT (Abuja)',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
]

/* Top 8 shown by default — the highest-hiring states */
const TOP_STATES = [
  'Lagos',
  'FCT (Abuja)',
  'Rivers',
  'Oyo',
  'Kano',
  'Enugu',
  'Kaduna',
  'Ogun',
]

const INDUSTRIES = [
  { label: 'Oil & Gas', icon: '⚙️', q: 'Oil & Gas' },
  { label: 'Banking', icon: '🏦', q: 'Bank' },
  { label: 'Tech', icon: '💻', q: 'Tech' },
  { label: 'Healthcare', icon: '🏥', q: 'Healthcare' },
  { label: 'NGO', icon: '🌱', q: 'NGO' },
  { label: 'Government', icon: '🏛️', q: 'Government' },
  { label: 'Education', icon: '🎓', q: 'Education' },
  { label: 'Real Estate', icon: '🏗️', q: 'Real Estate' },
  { label: 'Logistics', icon: '🚚', q: 'Logistics' },
  { label: 'Retail', icon: '🛍️', q: 'Retail' },
  { label: 'Hospitality', icon: '🏨', q: 'Hospitality' },
  { label: 'Media', icon: '📺', q: 'Media' },
]

const CATEGORIES = [
  { label: 'Engineering', q: 'Engineering' },
  { label: 'Design', q: 'Design' },
  { label: 'Product', q: 'Product' },
  { label: 'Marketing', q: 'Marketing' },
  { label: 'Sales', q: 'Sales' },
  { label: 'Customer Support', q: 'Customer Support' },
  { label: 'Finance', q: 'Finance' },
  { label: 'Human Resources', q: 'Human Resources' },
  { label: 'Operations', q: 'Operations' },
  { label: 'Data & Analytics', q: 'Data & Analytics' },
]

function stateToParam(state) {
  if (state === 'FCT (Abuja)') return 'Abuja'
  return state
}

export default function BrowseByLocationExpanded() {
  const [showAllStates, setShowAllStates] = useState(false)

  const statesToShow = showAllStates ? ALL_STATES : TOP_STATES

  return (
    <section className="container-app py-16 md:py-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="badge bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-900">
          <MapPin size={12} />
          Browse &amp; Discover
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
          Find jobs <span className="gradient-text">anywhere</span> in Nigeria
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
          Browse by state, industry, or category — updated daily.
        </p>
      </div>

      {/* ─── BROWSE BY LOCATION ─── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
            <MapPin size={16} className="text-brand-700 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Browse jobs by location
            </h3>
            <p className="text-xs text-gray-500">
              {ALL_STATES.length} states + FCT covered
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statesToShow.map((state) => (
            <Link
              key={state}
              to={`/jobs?location=${encodeURIComponent(stateToParam(state))}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 rounded-lg px-3 py-1.5 transition"
            >
              <MapPin size={12} />
              {state}
            </Link>
          ))}
        </div>

        {/* Show all toggle */}
        <button
          onClick={() => setShowAllStates((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline"
        >
          {showAllStates ? (
            <>
              <ChevronUp size={14} /> Show fewer states
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Show all 36 states + FCT
            </>
          )}
        </button>
      </div>

      {/* ─── BROWSE BY INDUSTRY ─── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
            <Building2 size={16} className="text-brand-700 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Browse by industry
            </h3>
            <p className="text-xs text-gray-500">
              Top sectors hiring right now
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind.label}
              to={`/jobs?q=${encodeURIComponent(ind.q)}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 rounded-lg px-3 py-2.5 transition"
            >
              <span className="text-base leading-none">{ind.icon}</span>
              <span className="truncate">{ind.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── BROWSE BY CATEGORY ─── */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
            <Briefcase size={16} className="text-brand-700 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Browse by category
            </h3>
            <p className="text-xs text-gray-500">
              Explore roles by job family
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.label}
              to={`/jobs?category=${encodeURIComponent(c.q)}`}
              className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 rounded-lg px-3 py-1.5 transition"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── PROMO CARDS ─── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Free CV Builder */}
        <Link
          to="/resume"
          className="group relative overflow-hidden rounded-2xl bg-gray-900 dark:bg-black text-white p-6 flex items-center gap-4 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand-500/30 rounded-full blur-3xl group-hover:bg-brand-500/50 transition-colors" />
          <div className="relative w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0">
            <FileText size={22} className="text-white" />
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="font-bold text-base">Free CV Builder</p>
            <p className="text-sm text-white/70 mt-0.5">
              ATS-friendly, ready in minutes
            </p>
          </div>
          <ArrowRight
            size={18}
            className="relative shrink-0 group-hover:translate-x-1 transition-transform"
          />
        </Link>

        {/* Free Job Alerts */}
        <Link
          to="/searches"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-teal-600 dark:from-green-800 dark:to-teal-800 text-white p-6 flex items-center gap-4 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
          <div className="relative w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
            <Bell size={22} className="text-white" />
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="font-bold text-base">Free Job Alerts</p>
            <p className="text-sm text-white/80 mt-0.5">
              New vacancies by email, daily
            </p>
          </div>
          <ArrowRight
            size={18}
            className="relative shrink-0 group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </section>
  )
}