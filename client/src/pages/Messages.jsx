import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Inbox,
  User,
  CalendarPlus,
  ExternalLink,
  Briefcase,
  Zap,
  MoreVertical,
} from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  subscribeConversations,
  subscribeMessages,
  subscribeUnreadByConversation,
  sendMessage,
  markConversationRead,
  getChatParticipantProfile,
  setTyping,
  clearTyping,
} from '../services/messageService'
import { friendlyError } from '../utils/errors'
import QuickReplies from '../components/chat/QuickReplies'
import MessageBubble from '../components/chat/MessageBubble'

const TYPING_TIMEOUT_MS = 3000
const TYPING_WRITE_THROTTLE_MS = 1500

export default function Messages() {
  const { user, profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('c')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [unreadMap, setUnreadMap] = useState({})
  const [participants, setParticipants] = useState({})
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showQuick, setShowQuick] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [activeConvTyping, setActiveConvTyping] = useState(null)
  const [showTyping, setShowTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const lastTypingWriteRef = useRef(0)

  const isEmployer = profile?.role === 'employer'

  // Conversations
  useEffect(() => {
    if (!user) return
    const unsub = subscribeConversations(user.uid, setConversations)
    return unsub
  }, [user])

  // Unread counts
  useEffect(() => {
    if (!user) return
    const unsub = subscribeUnreadByConversation(user.uid, setUnreadMap)
    return unsub
  }, [user])

  // Load participant profiles
  useEffect(() => {
    if (!user || conversations.length === 0) return
    let alive = true
    ;(async () => {
      const needed = new Set()
      conversations.forEach((c) => {
        const other = c.employerId === user.uid ? c.candidateId : c.employerId
        if (other && !participants[other]) needed.add(other)
      })
      if (needed.size === 0) return

      const results = {}
      await Promise.all(
        [...needed].map(async (uid) => {
          results[uid] = await getChatParticipantProfile(uid)
        })
      )
      if (alive) setParticipants((p) => ({ ...p, ...results }))
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, conversations])

  // Active thread messages
  useEffect(() => {
    if (!activeId || !user) return
    const unsub = subscribeMessages(activeId, setMessages)
    markConversationRead(activeId, user.uid).catch(() => {})
    return unsub
  }, [activeId, user])

  // Watch the active conversation for the typing field
  useEffect(() => {
    if (!activeId) {
      setActiveConvTyping(null)
      return
    }
    const ref = doc(db, 'conversations', activeId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setActiveConvTyping(snap.data().typing || null)
      } else {
        setActiveConvTyping(null)
      }
    })
    return unsub
  }, [activeId])

  // Show/hide the indicator with a timer that resets on every new typing event
  useEffect(() => {
    if (
      !activeConvTyping ||
      !user ||
      activeConvTyping.uid === user.uid ||
      !activeConvTyping.timestamp
    ) {
      setShowTyping(false)
      return
    }
    const age = Date.now() - activeConvTyping.timestamp
    if (age >= TYPING_TIMEOUT_MS) {
      setShowTyping(false)
      return
    }
    setShowTyping(true)
    const timer = setTimeout(
      () => setShowTyping(false),
      TYPING_TIMEOUT_MS - age
    )
    return () => clearTimeout(timer)
  }, [activeConvTyping, user])

  // Clear typing when leaving the thread or unmounting
  useEffect(() => {
    if (!activeId || !user) return
    const convId = activeId
    const uid = user.uid
    return () => {
      clearTyping(convId, uid).catch(() => {})
    }
  }, [activeId, user])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  const activeConv = conversations.find((c) => c.id === activeId)
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

  const otherId = useMemo(() => {
    if (!activeConv || !user) return null
    return activeConv.employerId === user.uid
      ? activeConv.candidateId
      : activeConv.employerId
  }, [activeConv, user])

  const otherProfile = otherId ? participants[otherId] : null

  const displayName = (conv) => {
    if (!conv || !user) return 'Conversation'
    const other =
      conv.employerId === user.uid ? conv.candidateId : conv.employerId
    const p = participants[other]
    if (p?.fullName) return p.fullName
    if (isEmployer && conv.candidateName) return conv.candidateName
    if (!isEmployer && conv.employerName) return conv.employerName
    if (isEmployer && conv.candidateEmail)
      return conv.candidateEmail.split('@')[0]
    if (conv.companyName) return conv.companyName
    return 'User'
  }

  const otherHeadline = (conv) => {
    if (!conv || !user) return ''
    const other =
      conv.employerId === user.uid ? conv.candidateId : conv.employerId
    const p = participants[other]
    if (p?.headline) return p.headline
    if (conv.jobTitle) return conv.jobTitle
    return ''
  }

  // Notify Firestore of typing (throttled)
  const handleChange = (e) => {
    setText(e.target.value)
    if (!activeConv || !user) return
    const now = Date.now()
    if (now - lastTypingWriteRef.current > TYPING_WRITE_THROTTLE_MS) {
      lastTypingWriteRef.current = now
      setTyping(activeConv.id, user.uid, profile?.fullName || '').catch(
        () => {}
      )
    }
  }

  // Also refresh the timestamp when the user keeps typing but throttle blocks it
  const handleKeyUp = () => {
    if (!activeConv || !user) return
    const now = Date.now()
    if (now - lastTypingWriteRef.current > TYPING_WRITE_THROTTLE_MS) {
      lastTypingWriteRef.current = now
      setTyping(activeConv.id, user.uid, profile?.fullName || '').catch(
        () => {}
      )
    }
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!text.trim() || !activeConv) return
    setSending(true)
    try {
      const recipientId =
        activeConv.employerId === user.uid
          ? activeConv.candidateId
          : activeConv.employerId

      await sendMessage({
        conversationId: activeConv.id,
        senderId: user.uid,
        recipientId,
        body: text,
      })
      setText('')
      lastTypingWriteRef.current = 0
      clearTyping(activeConv.id, user.uid).catch(() => {})
      textareaRef.current?.focus()
    } catch (err) {
      toast.error('Message not sent', friendlyError(err))
    } finally {
      setSending(false)
    }
  }

  const handleComposerKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBlur = () => {
    if (activeConv && user) {
      clearTyping(activeConv.id, user.uid).catch(() => {})
    }
  }

  const shareJobLink = () => {
    if (!activeConv?.jobId) return
    const url = `${window.location.origin}/jobs/${activeConv.jobId}`
    navigator.clipboard.writeText(url).then(
      () => toast.success('Job link copied', 'Paste it anywhere to share.'),
      () => toast.info('Copy this link', url)
    )
    setShowActions(false)
  }

  const openProfile = () => {
    if (!otherId) return
    if (isEmployer) navigate(`/applicants/${otherId}`)
    else navigate(`/messages`)
  }

  const scheduleInterview = () => {
    if (!activeConv || !otherId) return
    navigate(`/applicants/${otherId}`)
    toast.info(
      'Open the candidate profile',
      'Use the Schedule button on their card to book an interview.'
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold flex items-center gap-2 flex-wrap">
          Messages
          {totalUnread > 0 && (
            <span className="text-sm font-bold bg-accent-500 text-white rounded-full px-2.5 py-1">
              {totalUnread > 9 ? '9+' : totalUnread} unread
            </span>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Chat directly with employers and candidates.
        </p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="grid md:grid-cols-[320px_1fr] h-[72vh]">
          {/* ============================
              SIDEBAR
              ============================ */}
          <aside
            className={`border-r border-gray-100 overflow-y-auto ${
              activeId ? 'hidden md:block' : 'block'
            }`}
          >
            {conversations.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Inbox size={32} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">
                  Start one from an applicant or job page.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeId
                const unread = unreadMap[c.id] || 0
                const hasUnread = unread > 0
                const other =
                  c.employerId === user.uid ? c.candidateId : c.employerId
                const p = participants[other]
                const name = displayName(c)

                return (
                  <button
                    key={c.id}
                    onClick={() => setSearchParams({ c: c.id })}
                    className={`w-full text-left px-3 py-3 border-b border-gray-50 transition flex gap-3 ${
                      isActive
                        ? 'bg-brand-50'
                        : hasUnread
                        ? 'bg-accent-50/40 hover:bg-accent-50/60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {p?.photoURL ? (
                        <img
                          src={p.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm truncate ${
                            hasUnread
                              ? 'font-bold text-gray-900'
                              : 'font-semibold text-gray-700'
                          }`}
                        >
                          {name}
                        </span>
                        {c.lastMessageAt?.seconds && (
                          <span
                            className={`text-[10px] shrink-0 ${
                              hasUnread
                                ? 'text-accent-600 font-semibold'
                                : 'text-gray-400'
                            }`}
                          >
                            {new Date(
                              c.lastMessageAt.seconds * 1000
                            ).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      {c.jobTitle && (
                        <p className="text-[11px] text-brand-600 truncate mt-0.5">
                          {c.jobTitle}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-0.5">
                        <p
                          className={`text-xs truncate flex-1 ${
                            hasUnread
                              ? 'text-gray-800 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {c.lastMessage || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </aside>

          {/* ============================
              THREAD
              ============================ */}
          <section
            className={`flex flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}
          >
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-400">
                <div>
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-medium">Select a conversation</p>
                  <p className="text-xs mt-1">
                    Or start one from an applicant's profile.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* HEADER */}
                <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white">
                  <button
                    onClick={() => setSearchParams({})}
                    className="md:hidden text-gray-500 shrink-0"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold overflow-hidden">
                      {otherProfile?.photoURL ? (
                        <img
                          src={otherProfile.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName(activeConv)?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    {showTyping && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {displayName(activeConv)}
                    </p>
                    {showTyping ? (
                      <p className="text-xs text-green-600 font-medium truncate inline-flex items-center gap-1">
                        typing
                        <TypingDots />
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 truncate">
                        {otherHeadline(activeConv) || '—'}
                      </p>
                    )}
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowActions((v) => !v)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:text-brand-700 hover:bg-gray-100 transition"
                      aria-label="Actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {showActions && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30">
                        {isEmployer && (
                          <button
                            onClick={() => {
                              openProfile()
                              setShowActions(false)
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 border-b border-gray-50"
                          >
                            <User size={14} className="text-brand-600" />
                            <span className="text-sm font-medium text-gray-800">
                              View candidate profile
                            </span>
                          </button>
                        )}
                        {isEmployer && (
                          <button
                            onClick={() => {
                              scheduleInterview()
                              setShowActions(false)
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 border-b border-gray-50"
                          >
                            <CalendarPlus size={14} className="text-purple-600" />
                            <span className="text-sm font-medium text-gray-800">
                              Schedule interview
                            </span>
                          </button>
                        )}
                        {activeConv.jobId && (
                          <button
                            onClick={shareJobLink}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5 border-b border-gray-50"
                          >
                            <ExternalLink size={14} className="text-green-600" />
                            <span className="text-sm font-medium text-gray-800">
                              Share job link
                            </span>
                          </button>
                        )}
                        {activeConv.jobId && (
                          <button
                            onClick={() => {
                              navigate(`/jobs/${activeConv.jobId}`)
                              setShowActions(false)
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2.5"
                          >
                            <Briefcase size={14} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-800">
                              Open job details
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* JOB CONTEXT BAR */}
                {activeConv.jobTitle && (
                  <div className="px-4 py-2 bg-brand-50/60 border-b border-brand-100 flex items-center gap-2 text-xs">
                    <Briefcase size={12} className="text-brand-700 shrink-0" />
                    <span className="text-brand-800 font-medium truncate">
                      {activeConv.jobTitle}
                    </span>
                    {activeConv.jobId && (
                      <Link
                        to={`/jobs/${activeConv.jobId}`}
                        className="ml-auto text-brand-700 font-semibold hover:underline shrink-0"
                      >
                        Open →
                      </Link>
                    )}
                  </div>
                )}

                {/* MESSAGE LIST */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                      No messages yet. Say hello 👋
                    </div>
                  ) : (
                    messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        mine={m.senderId === user.uid}
                      />
                    ))
                  )}

                  {showTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* COMPOSER */}
                <form
                  onSubmit={handleSend}
                  className="relative border-t border-gray-100 p-3 bg-white"
                >
                  {showQuick && (
                    <QuickReplies
                      role={isEmployer ? 'employer' : 'job_seeker'}
                      onPick={(t) => {
                        setText((prev) => (prev ? prev + ' ' + t : t))
                        textareaRef.current?.focus()
                      }}
                      onClose={() => setShowQuick(false)}
                    />
                  )}

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuick((v) => !v)}
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition ${
                        showQuick
                          ? 'bg-accent-100 text-accent-700'
                          : 'text-gray-500 hover:text-accent-600 hover:bg-accent-50'
                      }`}
                      aria-label="Quick replies"
                      title="Quick replies"
                    >
                      <Zap size={16} />
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={handleChange}
                      onKeyUp={handleKeyUp}
                      onKeyDown={handleComposerKeyDown}
                      onBlur={handleBlur}
                      placeholder="Type a message... (Shift+Enter for a new line)"
                      rows={1}
                      className="input flex-1 !py-2.5 resize-none"
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />

                    <button
                      type="submit"
                      disabled={sending || !text.trim()}
                      className="btn-primary !py-2.5 !px-4 shrink-0"
                      aria-label="Send"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

/** Small inline animated dots for the header line */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="w-1 h-1 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  )
}