import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MessageSquare, Send, ArrowLeft, Inbox } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeConversations,
  subscribeMessages,
  sendMessage,
  markConversationRead,
} from '../services/messageService'

export default function Messages() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('c')

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeConversations(user.uid, setConversations)
    return unsub
  }, [user])

  useEffect(() => {
    if (!activeId || !user) return
    const unsub = subscribeMessages(activeId, setMessages)
    markConversationRead(activeId, user.uid).catch(() => {})
    return unsub
  }, [activeId, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeConv = conversations.find((c) => c.id === activeId)

  const otherName = (conv) => {
    if (profile?.role === 'employer') return conv.candidateName || 'Candidate'
    return conv.employerName || conv.companyName || 'Employer'
  }

  const handleSend = async (e) => {
    e.preventDefault()
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
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Messages</h1>
        <p className="text-gray-500 mt-1">Chat directly with employers and candidates.</p>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="grid md:grid-cols-[320px_1fr] h-[70vh]">
          {/* Sidebar */}
          <aside
            className={`border-r border-gray-100 overflow-y-auto ${
              activeId ? 'hidden md:block' : 'block'
            }`}
          >
            {conversations.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Inbox size={32} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start one from an applicant or job page.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeId
                return (
                  <button
                    key={c.id}
                    onClick={() => setSearchParams({ c: c.id })}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                      isActive ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {otherName(c)}
                      </span>
                      {c.lastMessageAt?.seconds && (
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(c.lastMessageAt.seconds * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {c.jobTitle && (
                      <p className="text-[11px] text-brand-600 truncate mt-0.5">
                        {c.jobTitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {c.lastMessage || 'No messages yet'}
                    </p>
                  </button>
                )
              })
            )}
          </aside>

          {/* Thread */}
          <section
            className={`flex flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}
          >
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 text-gray-400">
                <div>
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-medium">Select a conversation</p>
                  <p className="text-xs mt-1">Or start one from an applicant's profile.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <button
                    onClick={() => setSearchParams({})}
                    className="md:hidden text-gray-500"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {otherName(activeConv)}
                    </p>
                    {activeConv.jobTitle && (
                      <p className="text-xs text-gray-500 truncate">
                        Re: {activeConv.jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/40">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                      No messages yet. Say hello 👋
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user.uid
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                              mine
                                ? 'bg-brand-700 text-white rounded-br-sm'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            {m.createdAt?.seconds && (
                              <p
                                className={`text-[10px] mt-1 ${
                                  mine ? 'text-white/60' : 'text-gray-400'
                                }`}
                              >
                                {new Date(m.createdAt.seconds * 1000).toLocaleTimeString(
                                  [],
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="border-t border-gray-100 p-3 flex gap-2"
                >
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="input flex-1 !py-2.5"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="btn-primary !py-2.5 !px-4"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}