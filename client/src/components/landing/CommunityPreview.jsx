import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessagesSquare,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react'
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../../config/firebase'

function timeAgo(ts) {
  if (!ts?.seconds) return 'now'
  const secs = Math.floor(Date.now() / 1000 - ts.seconds)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function CommunityPreview({ config }) {
  const [messages, setMessages] = useState([])
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Live subscribe to the newest messages in the general channel
  useEffect(() => {
    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', 'general'),
      limit(50)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        items.sort((a, b) => {
          const ta = a.createdAt?.seconds || 0
          const tb = b.createdAt?.seconds || 0
          return tb - ta
        })
        setMessages(items.slice(0, 8))
        setLoading(false)
      },
      (err) => {
        console.warn('community preview failed:', err?.message)
        setMessages([])
        setLoading(false)
      }
    )
    return unsub
  }, [])

  // Get member count from the general channel doc
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'communityGroups'),
        where('isGeneral', '==', true),
        limit(1)
      ),
      (snap) => {
        if (!snap.empty) {
          setMemberCount(snap.docs[0].data().memberCount || 0)
        }
      },
      () => {}
    )
    return unsub
  }, [])

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-white via-green-50/30 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="container-app">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="badge bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900">
              <span className="relative flex w-2 h-2 mr-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
              </span>
              Live Chat · {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
              {config?.communityTitle || 'SkillNest Community'}
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg">
              {config?.communitySubtitle ||
                'Real conversations from Nigerian job seekers and employers. Join in — everyone is welcome.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-green-600" />
                Moderated
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock size={12} className="text-blue-600" />
                NDPR Compliant
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap size={12} className="text-accent-500" />
                Auto-join on signup
              </span>
            </div>
          </div>

          <Link to="/community" className="btn-primary group shrink-0">
            Join the chat
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {/* Messages grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card animate-pulse h-24 bg-gray-100 dark:bg-gray-900"
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="card text-center py-14 max-w-lg mx-auto">
            <MessagesSquare
              size={40}
              className="mx-auto text-gray-300 dark:text-gray-700 mb-3"
            />
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              Be the first to say hello
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign up and join the SkillNest community — meet other job seekers
              and employers.
            </p>
            <Link to="/register" className="btn-primary inline-flex mt-6">
              Create free account
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {messages.map((m) => (
              <article
                key={m.id}
                className="card card-hover flex items-start gap-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                  {m.senderPhotoURL ? (
                    <img
                      src={m.senderPhotoURL}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    m.senderName?.[0]?.toUpperCase() || <User size={14} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {m.senderName || 'Community member'}
                    </p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      · {timeAgo(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {m.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        {messages.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/community" className="btn-outline group">
              Open the full community
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}