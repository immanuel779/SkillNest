import { useEffect, useRef, useState } from 'react'
import {
  X,
  Send,
  Paperclip,
  Sparkles,
  Loader2,
  Trash2,
  FileText,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { extractPdfText } from '../../utils/pdf'
import {
  getOrCreateSessionId,
  ensureEmmaChat,
  appendEmmaMessage,
  askEmma,
  QUICK_REPLIES,
  WELCOME_MESSAGE,
} from '../../services/emmaService'

export default function EmmaChatWidget() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [hasNew, setHasNew] = useState(true)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)

  /* ---------------- Session bootstrap ---------------- */
  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)
    ;(async () => {
      const id = await ensureEmmaChat({
        sessionId: sid,
        userId: user?.uid || null,
        userName: profile?.fullName || user?.displayName || '',
        userEmail: user?.email || '',
      })
      setChatId(id)
    })()
  }, [user, profile])

  /* ---------------- Auto-scroll ---------------- */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, busy])

  /* ---------------- Open ---------------- */
  const openPanel = () => {
    setOpen(true)
    setHasNew(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  /* ---------------- Send message ---------------- */
  const send = async (textOverride, cvText = '', attachment = null) => {
    const text = (textOverride ?? input).trim()
    if (!text && !cvText) return
    if (busy) return

    setError('')
    setInput('')

    const userText = text || '📄 Uploaded my CV'

    // Show user message immediately (with attachment if any)
    const userMsg = {
      id: `local_u_${Date.now()}`,
      role: 'user',
      text: userText,
      attachment, // ← shown in the bubble
    }
    setMessages((m) => [...m, userMsg])

    // Persist for admin (fire and forget) — attachment triggers hasCvUpload
    appendEmmaMessage({
      chatId,
      role: 'user',
      text: userText,
      attachment,
    }).catch(() => {})

    // Build context for AI
    const context = [
      ...messages.map((m) => ({ role: m.role, text: m.text })),
      { role: 'user', text: userText },
    ]

    setBusy(true)
    try {
      const reply = await askEmma({
        messages: context,
        userName: profile?.fullName || user?.displayName || '',
        isSignedIn: !!user,
        isEmployer: profile?.role === 'employer',
        cvText,
      })
      const emmaMsg = {
        id: `local_e_${Date.now()}`,
        role: 'emma',
        text: reply,
      }
      setMessages((m) => [...m, emmaMsg])
      appendEmmaMessage({ chatId, role: 'emma', text: reply }).catch(() => {})
    } catch (err) {
      setError(err.message || 'Emma had a problem. Try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ---------------- CV upload ---------------- */
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }
    const isPdf =
      file.type === 'application/pdf' ||
      file.name?.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setError('Please upload a PDF for CV analysis.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const text = await extractPdfText(file)
      if (!text || text.trim().length < 50) {
        throw new Error(
          'Could not read text from this PDF. Try a different file.'
        )
      }

      // Build attachment info to display in the bubble + save to Firestore
      const attachment = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        charCount: text.length,
        preview: text.slice(0, 800), // short preview for expansion
      }

      await send(
        `📄 I've uploaded my CV — please analyze it.`,
        text,
        attachment
      )
    } catch (err) {
      setError(err.message || 'Could not read the CV.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /* ---------------- Reset chat ---------------- */
  const resetChat = async () => {
    if (!window.confirm('Start a fresh conversation with Emma?')) return
    try {
      localStorage.removeItem('skillnest_emma_session')
      localStorage.removeItem('skillnest_emma_chatId')
    } catch {}
    window.location.reload()
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={openPanel}
          className="fixed bottom-5 right-5 z-[60] group"
          aria-label="Chat with Emma AI"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform">
              <Sparkles size={22} />
              {hasNew && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              )}
            </div>
          </div>
          <span className="absolute -top-9 right-0 whitespace-nowrap bg-gray-900 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Chat with Emma AI ✨
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-[60] w-full sm:w-[400px] h-[100dvh] sm:h-[640px] sm:max-h-[85vh] flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-3.5 flex items-center gap-3 text-white shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-base">
                E
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight flex items-center gap-1.5">
                Emma AI
                <Sparkles size={12} className="opacity-80" />
              </p>
              <p className="text-[11px] text-white/80">
                {busy ? 'Typing…' : 'Online · replies instantly'}
              </p>
            </div>
            <button
              onClick={resetChat}
              className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition"
              aria-label="Reset chat"
              title="New conversation"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/60 to-white px-3 py-4 space-y-3"
          >
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <Bubble role="emma">{WELCOME_MESSAGE}</Bubble>
                <div className="flex flex-wrap gap-2 pl-1">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => send(q.label)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-full px-3 py-1.5 transition shadow-sm"
                    >
                      <span>{q.icon}</span> {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message history */}
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} attachment={m.attachment}>
                {m.text}
              </Bubble>
            ))}

            {/* Typing indicator */}
            {busy && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  E
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-gray-100 bg-white p-3 shrink-0">
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || busy}
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-brand-700 hover:bg-brand-50 transition disabled:opacity-50"
                title="Upload CV for analysis"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Paperclip size={16} />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={onFile}
                className="hidden"
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                className="flex-1 min-w-0 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                style={{ maxHeight: 100 }}
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by Emma AI ·{' '}
              <span className="font-semibold">SkillNest</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/* ============================================================
   Sub-components
   ============================================================ */

function Bubble({ role, children, attachment }) {
  const isUser = role === 'user'
  return (
    <div
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          E
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
        }`}
      >
        {children}

        {attachment && <CvCard attachment={attachment} mine={isUser} />}
      </div>
    </div>
  )
}

/**
 * Shows a card with the uploaded CV — file name, size, and expandable
 * preview of the extracted text so the user can confirm what Emma will read.
 */
function CvCard({ attachment, mine }) {
  const [expanded, setExpanded] = useState(false)

  const sizeKb = attachment.size
    ? `${(attachment.size / 1024).toFixed(0)} KB`
    : ''

  return (
    <div
      className={`mt-2 rounded-lg overflow-hidden border ${
        mine
          ? 'bg-white/15 border-white/30'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            mine ? 'bg-white/20' : 'bg-brand-50'
          }`}
        >
          <FileText
            size={14}
            className={mine ? 'text-white' : 'text-brand-700'}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-bold truncate ${
              mine ? 'text-white' : 'text-gray-900'
            }`}
          >
            {attachment.name || 'CV.pdf'}
          </p>
          <p
            className={`text-[10px] ${
              mine ? 'text-white/80' : 'text-gray-500'
            }`}
          >
            {sizeKb}
            {attachment.charCount
              ? ` · ${attachment.charCount.toLocaleString()} chars extracted`
              : ''}
          </p>
        </div>
        {attachment.preview && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition ${
              mine
                ? 'hover:bg-white/20 text-white'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label={expanded ? 'Hide preview' : 'View preview'}
            title="View extracted text"
          >
            {expanded ? <ChevronUp size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>

      {expanded && attachment.preview && (
        <div
          className={`px-2.5 pb-2.5 pt-1 border-t ${
            mine ? 'border-white/20' : 'border-gray-200'
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
              mine ? 'text-white/70' : 'text-gray-400'
            }`}
          >
            Extracted text preview
          </p>
          <pre
            className={`text-[10px] leading-relaxed whitespace-pre-wrap font-mono rounded p-2 max-h-40 overflow-y-auto ${
              mine
                ? 'bg-white/10 text-white/90'
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            {attachment.preview}
            {attachment.charCount > 800 ? '\n\n…(preview truncated)' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}

function Dot({ delay }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  )
}