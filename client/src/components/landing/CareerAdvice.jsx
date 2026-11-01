import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ArrowRight,
  Clock,
  User,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react'
import { listPublishedBlogPosts } from '../../services/landingService'

const PLACEHOLDER_POSTS = [
  {
    id: 'ph-1',
    title: 'Job Opportunities in Lagos: What Is Actually Hiring Right Now',
    excerpt:
      'A city-by-city look at what is hiring in Lagos and Abuja right now — corporate, NGO, remote, and entry-level roles.',
    category: 'Work Life Balance',
    readingTime: 6,
    placeholder: true,
  },
  {
    id: 'ph-2',
    title: 'Application Tips: How to Apply and Actually Get Hired',
    excerpt:
      'Applications fail for the same handful of reasons across every sector. Here is exactly what a strong employer looks for.',
    category: 'Job Market',
    readingTime: 5,
    placeholder: true,
  },
  {
    id: 'ph-3',
    title: 'How to Find a Job in Any Nigerian City',
    excerpt:
      'What separates a real recruitment portal from a dead job board — and how to use one to actually get hired.',
    category: 'Career Tips',
    readingTime: 4,
    placeholder: true,
  },
]

function fmtDate(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function CareerAdvice({ config }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = await listPublishedBlogPosts(3)
      if (alive) {
        setPosts(list)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (!config?.showBlog) return null

  const display = posts.length > 0 ? posts : PLACEHOLDER_POSTS

  return (
    <section className="container-app py-16 md:py-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <span className="badge bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-900">
            <BookOpen size={12} />
            Career Resources
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
            {config?.blogTitle || 'Career Advice & Job Search Tips'}
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg">
            Practical guides written for Nigerian professionals.
          </p>
        </div>
        <Link
          to="/blog"
          className="text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1 shrink-0"
        >
          All Articles
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {display.map((p, i) => (
          <Link
            key={p.id}
            to={p.placeholder ? '/blog' : `/blog/${p.slug || p.id}`}
            className="card card-hover group flex flex-col overflow-hidden !p-0 reveal"
            style={{ animationDelay: `${0.05 + i * 0.07}s` }}
          >
            {/* Cover / Hero block */}
            <div className="relative h-40 bg-gradient-to-br from-brand-500 via-brand-700 to-accent-500 overflow-hidden">
              {p.coverUrl ? (
                <img
                  src={p.coverUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/90">
                    <Sparkles size={32} className="mx-auto opacity-80" />
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-90">
                      SkillNest Blog
                    </p>
                  </div>
                </div>
              )}
              {/* Category badge */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-wide bg-white/95 dark:bg-gray-900/95 text-brand-700 dark:text-brand-400 rounded-full px-2.5 py-1">
                  {p.category || 'Career'}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors line-clamp-2 text-balance">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed flex-1">
                {p.excerpt || p.summary}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <User size={11} />
                  {p.authorName || 'SkillNest Team'}
                </span>
                {p.readingTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} />
                    {p.readingTime} min read
                  </span>
                )}
                {!p.placeholder && p.publishedAt && (
                  <span>· {fmtDate(p.publishedAt)}</span>
                )}
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
                Read more
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Post a tip CTA for employers */}
      {!loading && (
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50/50 dark:from-brand-950 dark:to-gray-900 border border-brand-100 dark:border-brand-900 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center shrink-0">
              <FileText size={18} className="text-brand-700" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white">
                Looking for a role?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Build a free, ATS-friendly CV in 3 minutes.
              </p>
              <Link
                to="/resume"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline mt-2"
              >
                Build Free CV →
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 border border-gray-200 dark:border-gray-800 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-green-700" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white">
                Hiring? Post in minutes.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Reach thousands of verified Nigerian job seekers.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline mt-2"
              >
                Post a job →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}