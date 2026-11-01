import { useEffect, useRef, useState } from 'react'
import {
  Send,
  ArrowLeft,
  MoreVertical,
  User,
  LogOut,
  UserPlus,
  Info,
  Users as UsersIcon,
  Loader2,
  Sparkles,
  Hash,
  MessageSquare,
  Shield
} from 'lucide-react'
import {
  subscribeGroupMessages,
  sendGroupMessage,
  removeGroupMember,
  deleteGroupMessage,
} from '../../services/communityGroupService'
import { useToast } from '../../context/ToastContext'
import GroupInfoModal from './GroupInfoModal'
import AddMembersModal from './AddMembersModal'

function timeFmt(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayLabel(ts) {
  if (!ts?.seconds) return ''
  const d = new Date(ts.seconds * 1000)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

export default function GroupChat({ group, user, profile, onBack }) {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const isGeneral = group.id === 'general' || group.isGeneral
  const isOwner = group.ownerId === user.uid
  const isMember = (group.memberIds || []).includes(user.uid)

  useEffect(() => {
    const unsub = subscribeGroupMessages(group.id, setMessages)
    return unsub
  }, [group.id])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await sendGroupMessage({
        groupId: group.id,
        senderId: user.uid,
        senderName: profile?.fullName || user.displayName || user.email || 'User',
        senderPhotoURL: profile?.photoURL || '',
        body: text,
      })
      setText('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('❌ sendGroupMessage failed', err)
      toast.error(
        'Message not sent',
        err?.code ? `${err.code}: ${err.message}` : err?.message || 'Unknown error'
      )
    } finally {
      setSending(false)
    }
  }

  const handleLeave = async () => {
    if (isGeneral) {
      toast.info('You cannot leave the general channel.')
      return
    }
    if (!window.confirm(`Leave "${group.name}"? You'll need a new invite to rejoin.`)) return
    try {
      await removeGroupMember(group.id, user.uid)
      toast.success('Left group')
      onBack?.()
    } catch (err) {
      console.error('Leave failed:', err?.code, err?.message)
      toast.error('Could not leave', err?.message)
    }
  }

  const handleDeleteMessage = async (msg) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await deleteGroupMessage(msg.id)
    } catch (err) {
      console.error('Delete failed:', err?.code, err?.message)
      toast.error('Could not delete', err?.message)
    }
  }

  // Group messages by day
  const grouped = []
  let lastDay = null
  messages.forEach((m) => {
    const label = dayLabel(m.createdAt)
    if (label !== lastDay) {
      grouped.push({ type: 'day', label, id: `day-${label}` })
      lastDay = label
    }
    grouped.push({ type: 'msg', msg: m, id: m.id })
  })

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden text-gray-500 hover:text-gray-900 shrink-0 p-1.5 -ml-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          onClick={() => setShowInfo(true)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-gray-50 rounded-xl p-1.5 -ml-1.5 transition"
        >
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-sm ${
            isGeneral
              ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white shadow-[#7c3aed]/20'
              : 'bg-white border border-gray-200 text-[#7c3aed]'
          }`}>
            {group.photoURL ? (
              <img src={group.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              (group.name || '?')[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-extrabold text-gray-900 truncate text-base">
                {group.name}
              </p>
              {isGeneral && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-full px-1.5 py-0.5 uppercase tracking-wider">
                  <Sparkles size={10} /> Official
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">
              {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
              {group.description && ` · ${group.description.slice(0, 40)}`}
            </p>
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
            aria-label="Menu"
          >
            <MoreVertical size={18} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => { setShowInfo(true); setShowMenu(false) }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Info size={16} className="text-[#7c3aed]" />
                  <span className="text-sm font-semibold text-gray-700">Group Info</span>
                </button>
                {!isGeneral && (
                  <button
                    onClick={() => { setShowAdd(true); setShowMenu(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50 transition-colors"
                  >
                    <UserPlus size={16} className="text-[#7c3aed]" />
                    <span className="text-sm font-semibold text-gray-700">Add Members</span>
                  </button>
                )}
                {!isGeneral && isMember && (
                  <button
                    onClick={() => { setShowMenu(false); handleLeave() }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50 text-red-600 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-bold">Leave Group</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MESSAGE FEED ─── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <MessageSquare size={32} className="text-[#7c3aed]" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {isGeneral ? 'Welcome to the community!' : 'No messages yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {isGeneral ? 'Say hello to everyone 👋' : 'Be the first to post here.'}
            </p>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === 'day') {
            return (
              <div key={item.id} className="flex items-center justify-center py-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white rounded-full px-3 py-1 border border-gray-200 shadow-sm">
                  {item.label}
                </span>
              </div>
            )
          }

          const m = item.msg
          const mine = m.senderId === user.uid
          
          return (
            <div
              key={item.id}
              className={`flex gap-2.5 group ${mine ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar for other users */}
              {!mine && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#7c3aed] text-xs font-bold shrink-0 overflow-hidden self-end mb-1 shadow-sm">
                  {m.senderPhotoURL ? (
                    <img src={m.senderPhotoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    m.senderName?.[0]?.toUpperCase() || <User size={14} />
                  )}
                </div>
              )}
              
              <div className={`max-w-[80%] sm:max-w-[65%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender Name (for others) */}
                {!mine && (
                  <p className="text-[11px] font-bold text-gray-500 mb-1 px-1">
                    {m.senderName}
                  </p>
                )}
                
                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-2.5 text-[13px] sm:text-sm whitespace-pre-line break-words shadow-sm transition-all ${
                    mine
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'
                  }`}
                >
                  {m.body}
                  
                  {/* Timestamp inside bubble */}
                  <p className={`text-[9px] mt-1.5 font-medium ${mine ? 'text-purple-200 text-right' : 'text-gray-400 text-right'}`}>
                    {timeFmt(m.createdAt)}
                  </p>
                </div>
                
                {/* Actions (Reveal on hover) */}
                {mine && (
                  <button
                    onClick={() => handleDeleteMessage(m)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-gray-400 hover:text-red-500 mt-1 px-1 transition-opacity"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── COMPOSER ─── */}
      {isMember || isGeneral ? (
        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 bg-white p-3 sm:p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-end gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
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
                placeholder={`Message ${group.name}…`}
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-xl py-3 pl-4 pr-12 text-sm outline-none resize-none transition-all placeholder:text-gray-500"
                style={{ minHeight: 48, maxHeight: 120 }}
              />
            </div>
            
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-12 h-12 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-[#7c3aed]/20 disabled:opacity-50 disabled:shadow-none"
              aria-label="Send"
            >
              {sending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-6 bg-gray-50 text-center text-sm font-semibold text-gray-500 shrink-0">
          You must be a member to post in this group.
        </div>
      )}

      {/* Modals */}
      {showInfo && (
        <GroupInfoModal
          group={group}
          user={user}
          onClose={() => setShowInfo(false)}
          onLeave={handleLeave}
          onAddMembers={() => {
            setShowInfo(false)
            setShowAdd(true)
          }}
        />
      )}
      {showAdd && (
        <AddMembersModal
          group={group}
          user={user}
          profile={profile}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}