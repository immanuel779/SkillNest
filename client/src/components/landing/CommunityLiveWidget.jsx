import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessagesSquare,
  Search,
  Send,
  Loader2,
  User,
  Hash,
  TrendingUp,
  Shield,
  ArrowRight,
  LogIn,
  Reply,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  GENERAL_CHANNEL_ID,
  GENERAL_CHANNEL_NAME,
  ensureGeneralMembership,
  subscribeGroupMessages,
  sendGroupMessage,
} from '../../services/communityGroupService'

const STATES = [
  { v: 'lagos', l: 'Lagos' },
  { v: 'abuja', l: 'Abuja (FCT)' },
  { v: 'rivers', l: 'Rivers' },
  { v: 'oyo', l: 'Oyo' },
  { v: 'kano', l: 'Kano' },
  { v: 'enugu', l: 'Enugu' },
  { v: 'kaduna', l: 'Kaduna' },
  { v: 'anambra', l: 'Anambra' },
]

const TRENDING = [
  '#NGOJobs',
  '#RemoteWork',
  '#GraduateTrainee',
  '#SalaryTips',
  '#CVHelp',
  '#OilAndGas',
  '#BankJobs',
  '#LagosJobs',
]

function timeAgo(ts) {
  if (!ts?.seconds) return 'now'
  const s = Math.floor(Date.now() / 1000 - ts.seconds)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export default function CommunityLiveWidget({ config }) {
  const { user, profile } = useAuth()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [activeState, setActiveState] = useState(null)
  const [searchContacts, setSearchContacts] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    ensureGeneralMembership(user.uid).catch(() => {})
  }, [user])

  useEffect(() => {
    const unsub = subscribeGroupMessages(
      GENERAL_CHANNEL_ID,
      (list) => {
        setMessages(list)
        setLoading(false)
      },
      100
    )
    return unsub
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const participants = useMemo(() => {
    const map = {}
    messages.forEach((m) => {
      if (!m.senderId) return
      if (!map[m.senderId]) {
        map[m.senderId] = {
          id: m.senderId,
          name: m.senderName || 'User',
          photoURL: m.senderPhotoURL || '',
          count: 0,
        }
      }
      map[m.senderId].count += 1
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [messages])

  const filteredParticipants = searchContacts.trim()
    ? participants.filter((p) =>
        p.name.toLowerCase().includes(searchContacts.toLowerCase())
      )
    : participants

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!user) {
      toast.info('Sign in to chat', 'Join the community to post messages.')
      return
    }
    if (!text.trim() || sending) return

    const body = replyTo
      ? `↩ Replying to ${replyTo.senderName}:\n"${replyTo.body.slice(
          0,
          60
        )}..."\n\n${text}`
      : text

    setSending(true)
    try {
      await sendGroupMessage({
        groupId: GENERAL_CHANNEL_ID,
        senderId: user.uid,
        senderName:
          profile?.fullName || user.displayName || user.email || 'User',
        senderPhotoURL: profile?.photoURL || '',
        body,
      })
      setText('')
      setReplyTo(null)
      inputRef.current?.focus()
    } catch (err) {
      toast.error('Message not sent', err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="container-app py-16 md:py-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="badge bg-green-50 text-green-700 border border-green-100">
          <span className="relative flex w-2 h-2 mr-1">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-green-400" />
          </span>
          Live Community
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-balance">
          {config?.communityTitle || 'The Nigerian Job Community'}
        </h2>
        <p className="mt-3 text-gray-600 text-lg">
          {config?.communitySubtitle ||
            'Connect with fellow Nigerians. Share tips, ask about vacancies, discuss salaries.'}
        </p>
      </div>

      {/* Widget */}
      <div className="card !p-0 overflow-hidden border-2 border-gray-100 shadow-xl">
        <div className="grid md:grid-cols-[280px_1fr] h-[620px]">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col border-r border-gray-100 bg-gray-50/40">
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <MessagesSquare size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    SkillNest Chat
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {participants.length} active
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  value={searchContacts}
                  onChange={(e) => setSearchContacts(e.target.value)}
                  placeholder="Search contacts..."
                  className="bg-transparent outline-none text-xs w-full"
                />
              </div>
            </div>

            {/* Sidebar scroll */}
            <div className="flex-1 overflow-y-auto">
              {/* User chip */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center overflow-hidden">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-white" />
                    )}
                    {user && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {user ? profile?.fullName || 'You' : 'Guest'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {user ? 'Online' : 'Not signed in'}
                    </p>
                  </div>
                </div>
              </div>

              {/* States */}
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                  Browse by state
                </p>
                <div className="space-y-0.5">
                  {STATES.map((s) => (
                    <button
                      key={s.v}
                      onClick={() =>
                        setActiveState(activeState === s.v ? null : s.v)
                      }
                      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                        activeState === s.v
                          ? 'bg-brand-50 text-brand-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate">
                        {s.l}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        0/—
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              {filteredParticipants.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                    Active members
                  </p>
                  <div className="space-y-1">
                    {filteredParticipants.slice(0, 10).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 px-1 py-1"
                      >
                        <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                          {p.photoURL ? (
                            <img
                              src={p.photoURL}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.name?.[0]?.toUpperCase()
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {p.count} {p.count === 1 ? 'post' : 'posts'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sign-in CTA (bottom of sidebar) */}
            {!user && (
              <div className="p-3 border-t border-gray-100 bg-white">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 w-full bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg px-3 py-2 transition"
                >
                  <LogIn size={12} /> Sign in to chat
                </Link>
              </div>
            )}
          </aside>

          {/* Main forum */}
          <section className="flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shrink-0">
                <Hash size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {GENERAL_CHANNEL_NAME}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-500" />
                    </span>
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  Discuss jobs, share tips, connect with employers
                </p>
              </div>

              {/* Avatar stack */}
              {participants.length > 0 && (
                <div className="hidden sm:flex items-center -space-x-2 shrink-0">
                  {participants.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                      title={p.name}
                    >
                      {p.photoURL ? (
                        <img
                          src={p.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        p.name?.[0]?.toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/community"
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-2.5 py-1 shrink-0 transition"
              >
                <Shield size={10} /> Open
              </Link>
            </div>

            {/* Trending tags */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/60 overflow-x-auto no-scrollbar">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent-600 shrink-0">
                <TrendingUp size={10} />
                Trending
              </span>
              {TRENDING.map((tag) => (
                <Link
                  key={tag}
                  to={`/jobs?q=${encodeURIComponent(tag.slice(1))}`}
                  className="shrink-0 text-[11px] font-semibold bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-700 rounded-full px-2.5 py-1 transition whitespace-nowrap"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/40"
            >
              {loading ? (
                <div className="text-center py-16">
                  <Loader2
                    size={20}
                    className="animate-spin text-brand-600 mx-auto"
                  />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 py-16">
                  <MessagesSquare
                    size={36}
                    className="mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm font-medium">Be the first to post</p>
                  <p className="text-xs mt-1">
                    Start a conversation with the community.
                  </p>
                </div>
              ) : (
                messages.slice(-30).map((m) => {
                  const isAdmin = m.senderName
                    ?.toLowerCase()
                    .includes('skillnest')
                  return (
                    <article
                      key={m.id}
                      className={`rounded-xl border bg-white p-3 transition ${
                        isAdmin
                          ? 'border-brand-200 bg-gradient-to-br from-brand-50/40 to-white'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {m.senderPhotoURL ? (
                            <img
                              src={m.senderPhotoURL}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.senderName?.[0]?.toUpperCase() || (
                              <User size={13} />
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs text-gray-900 truncate">
                              {m.senderName || 'Anonymous'}
                            </p>
                            {isAdmin && (
                              <span className="text-[9px] font-bold text-brand-700 bg-brand-100 rounded px-1.5 py-0.5">
                                ADMIN
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              · {timeAgo(m.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed break-words">
                            {m.body}
                          </p>
                          <button
                            onClick={() => {
                              if (!user) {
                                toast.info('Sign in to reply')
                                return
                              }
                              setReplyTo(m)
                              inputRef.current?.focus()
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-brand-700 mt-2 transition"
                          >
                            <Reply size={11} /> Reply
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSend}
              className="border-t border-gray-100 bg-white"
            >
              {replyTo && (
                <div className="flex items-start gap-2 px-3 pt-3">
                  <div className="flex-1 min-w-0 rounded-lg bg-gray-50 border-l-4 border-brand-500 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-brand-700">
                      Replying to {replyTo.senderName}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {replyTo.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-red-600 text-xs font-semibold shrink-0 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="p-2.5 sm:p-3 flex items-end gap-2">
                <div className="flex-1 min-w-0 relative">
                  {user ? (
                    <>
                      <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        rows={1}
                        placeholder="Join the conversation — type a message..."
                        className="input !py-2.5 resize-none text-sm pr-16"
                        style={{ minHeight: 42, maxHeight: 120 }}
                      />
                      <span className="absolute right-3 bottom-3 text-[10px] text-gray-400 pointer-events-none">
                        {text.length}/500
                      </span>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2.5 text-sm text-gray-500 transition"
                    >
                      <LogIn size={14} />
                      Sign in to join the conversation...
                    </Link>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!user || sending || !text.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition shrink-0"
                  aria-label="Send"
                >
                  {sending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* CTA below */}
      <div className="mt-6 text-center">
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
        >
          Open full community — create your own group
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}