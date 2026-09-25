import { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  MessageSquare,
  User,
  FileText,
  Loader2,
  Download,
  Search,
  TrendingUp,
  Clock,
} from 'lucide-react'
import {
  listAllEmmaChats,
  getEmmaChatMessages,
} from '../../services/emmaService'

function fmtTime(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function csvEscape(v) {
  if (v == null) return ''
  const s = String(v).replace(/"/g, '""')
  return /[",\n]/.test(s) ? `"${s}"` : s
}

export default function AdminEmma() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const list = await listAllEmmaChats()
      if (alive) {
        setChats(list)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const openChat = async (chat) => {
    setActive(chat)
    setLoadingMessages(true)
    const msgs = await getEmmaChatMessages(chat.id)
    setMessages(msgs)
    setLoadingMessages(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((c) =>
      [c.userName, c.userEmail, c.lastMessagePreview]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [chats, search])

  const stats = useMemo(() => {
    const total = chats.length
    const withCv = chats.filter((c) => c.hasCvUpload).length
    const today = chats.filter((c) => {
      const t = c.startedAt?.seconds || 0
      return t > Date.now() / 1000 - 86400
    }).length
    const totalMsgs = chats.reduce((s, c) => s + (c.messageCount || 0), 0)
    return { total, withCv, today, totalMsgs }
  }, [chats])

  const exportCsv = () => {
    const header = [
      'Started',
      'Name',
      'Email',
      'Messages',
      'Has CV',
      'Last message',
    ]
    const rows = filtered.map((c) => [
      fmtTime(c.startedAt),
      c.userName || 'Visitor',
      c.userEmail || '',
      c.messageCount || 0,
      c.hasCvUpload ? 'Yes' : 'No',
      c.lastMessagePreview || '',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emma-chats-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-brand-600" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Emma AI
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
                AI Assistant
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Every conversation between Emma and your visitors.
            </p>
          </div>
        </div>

        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="btn-outline !py-2 !px-3 text-sm disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={MessageSquare}
          label="Total chats"
          value={stats.total}
          color="brand"
        />
        <StatCard
          icon={Clock}
          label="Last 24 hours"
          value={stats.today}
          color="accent"
        />
        <StatCard
          icon={FileText}
          label="CVs uploaded"
          value={stats.withCv}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Total messages"
          value={stats.totalMsgs}
          color="green"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input pl-10"
          placeholder="Search by name, email, or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List + detail */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        {/* Chats list */}
        <div className="card !p-0 overflow-hidden max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Sparkles size={28} className="mx-auto mb-2 opacity-50" />
              No conversations yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openChat(c)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                      active?.id === c.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                        <User size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {c.userName || 'Visitor'}
                          </p>
                          {c.hasCvUpload && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-700 rounded px-1.5 py-0.5">
                              CV
                            </span>
                          )}
                          {c.status === 'resolved' && (
                            <span className="text-[9px] font-bold bg-green-100 text-green-700 rounded px-1.5 py-0.5">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        {c.userEmail && (
                          <p className="text-[11px] text-gray-500 truncate">
                            {c.userEmail}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {c.lastMessagePreview || '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {fmtTime(c.lastMessageAt)}
                          {c.messageCount ? ` · ${c.messageCount} msgs` : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        <div className="card !p-0 overflow-hidden min-h-[400px] flex flex-col max-h-[70vh]">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-400">
              <div>
                <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Select a conversation to view
                </p>
                <p className="text-xs mt-1">
                  Full transcript will show here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                  {(active.userName || 'V')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {active.userName || 'Visitor'}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {active.userEmail || 'Not signed in'} ·{' '}
                    {fmtTime(active.startedAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {loadingMessages ? (
                  <div className="text-center py-10">
                    <Loader2
                      size={20}
                      className="animate-spin text-gray-400 mx-auto"
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-10">
                    No messages in this chat yet.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isUser = m.role === 'user'
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line shadow-sm ${
                            isUser
                              ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-[10px] opacity-70 mb-0.5 font-semibold">
                            {isUser ? 'User' : 'Emma AI'}
                          </p>
                          {m.text}

                          {/* CV attachment card */}
                          {m.attachment?.name && (
                            <div
                              className={`mt-2 rounded-lg border px-2 py-1.5 flex items-center gap-2 ${
                                isUser
                                  ? 'bg-white/15 border-white/30'
                                  : 'bg-purple-50 border-purple-200'
                              }`}
                            >
                              <FileText
                                size={12}
                                className={
                                  isUser ? 'text-white' : 'text-purple-700'
                                }
                              />
                              <span
                                className={`text-[10px] font-bold truncate ${
                                  isUser ? 'text-white' : 'text-purple-800'
                                }`}
                              >
                                {m.attachment.name}
                              </span>
                              {m.attachment.charCount && (
                                <span
                                  className={`text-[9px] shrink-0 ${
                                    isUser ? 'text-white/80' : 'text-purple-600'
                                  }`}
                                >
                                  {m.attachment.charCount.toLocaleString()}{' '}
                                  chars
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const bg = {
    brand: 'bg-brand-50 text-brand-700',
    accent: 'bg-accent-50 text-accent-600',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
  }[color]
  return (
    <div className="card">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${bg}`}
      >
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold mt-0.5">{value}</p>
    </div>
  )
}