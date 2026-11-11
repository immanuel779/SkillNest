import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, ArrowLeft, MoreVertical, User, LogOut, UserPlus, Info,
  Loader2, Reply, Shield, Hash, Sparkles, MessageSquare, Globe,
  Pencil, Trash2, Check, X, CornerDownRight
} from 'lucide-react'
import {
  subscribeGroupMessages,
  sendGroupMessage,
  removeGroupMember,
  deleteGroupMessage,
  editGroupMessage // 👈 Imported the new function
} from '../../services/communityGroupService'
import { useToast } from '../../context/ToastContext'
import GroupInfoModal from './GroupInfoModal'
import AddMembersModal from './AddMembersModal'

const TRENDING_TAGS = [
  { label: '#NGOJobs', to: '/jobs?q=NGO' },
  { label: '#RemoteWork', to: '/jobs?workMode=remote' },
  { label: '#GraduateTrainee', to: '/jobs?q=Graduate' },
  { label: '#SalaryTips', to: '/jobs?q=salary' },
  { label: '#CVHelp', to: '/jobs?category=Human+Resources' },
  { label: '#OilAndGas', to: '/jobs?q=Oil' },
  { label: '#BankJobs', to: '/jobs?q=Bank' },
  { label: '#LagosJobs', to: '/jobs?location=Lagos' },
  { label: '#TechJobs', to: '/jobs?category=Engineering' },
  { label: '#AbujaJobs', to: '/jobs?location=Abuja' },
]

function timeAgo(ts) {
  if (!ts?.seconds) return 'now'
  const s = Math.floor(Date.now() / 1000 - ts.seconds)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ForumChat({ group, user, profile, onBack }) {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  // ─── NEW EDITING STATES ───
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const editInputRef = useRef(null)

  if (!group) return null

  const isGeneral = group.id === 'general' || group.isGeneral
  const isMember = (group.memberIds || []).includes(user?.uid)

  useEffect(() => {
    const unsub = subscribeGroupMessages(group.id, setMessages)
    return unsub
  }, [group.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const topParticipants = useMemo(() => {
    const map = {}
    messages.forEach((m) => {
      if (!m.senderId) return
      if (!map[m.senderId]) {
        map[m.senderId] = { id: m.senderId, name: m.senderName || 'User', photoURL: m.senderPhotoURL || '', count: 0 }
      }
      map[m.senderId].count += 1
    })
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 4)
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!text.trim() || sending) return
    if (!user?.uid) {
      toast.error('Error', 'You must be logged in to chat.')
      return
    }

    const body = replyTo
      ? `↩ Replying to ${replyTo.senderName}:\n"${replyTo.body.slice(0, 80)}..."\n\n${text}`
      : text

    setSending(true)
    try {
      await sendGroupMessage({
        groupId: group.id,
        senderId: user.uid,
        senderName: profile?.fullName || user.displayName || user.email || 'User',
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

  // ─── HANDLE DELETE (WhatsApp style: vanishes for everyone instantly) ───
  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message? This will remove it for everyone.')) return
    try {
      await deleteGroupMessage(msg.id)
      toast.success('Message deleted')
    } catch (err) {
      toast.error('Could not delete', err.message)
    }
  }

  // ─── HANDLE START EDITING ───
  const startEditing = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.body)
    setTimeout(() => {
      editInputRef.current?.focus()
    }, 100)
  }

  // ─── HANDLE SAVE EDIT ───
  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return
    setSavingEdit(true)
    try {
      await editGroupMessage(msgId, editText)
      setEditingId(null)
      setEditText('')
      toast.success('Message updated')
    } catch (err) {
      toast.error('Failed to edit', err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleLeave = async () => {
    if (isGeneral) {
      toast.info('You cannot leave the general channel.')
      return
    }
    if (!window.confirm(`Leave "${group.name}"?`)) return
    try {
      await removeGroupMember(group.id, user.uid)
      toast.success('Left group')
      onBack?.()
    } catch (err) {
      toast.error('Could not leave', err.message)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] bg-[#f8fafc] relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <button onClick={onBack} className="lg:hidden text-gray-500 hover:text-gray-900 shrink-0 p-1.5 -ml-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft size={18} />
        </button>

        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center shrink-0 overflow-hidden shadow-sm shadow-[#7c3aed]/20">
          {group.photoURL ? <img src={group.photoURL} alt="" className="w-full h-full object-cover" /> : <Hash size={20} className="text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-gray-900 truncate text-base">{group.name}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#7c3aed] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#7c3aed]" />
              </span>
              Live
            </span>
          </div>
          
          <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5 flex items-center gap-1">
            {isGeneral ? (
              <span className="flex items-center gap-1 text-[#7c3aed] font-semibold">
                <Globe size={12} /> Public Channel · Everyone
              </span>
            ) : (
              `${group.memberCount || 0} members`
            )}
            <span className="text-gray-300">·</span> {messages.length} posts
          </p>
        </div>

        {topParticipants.length > 0 && (
          <div className="hidden sm:flex items-center -space-x-2 shrink-0">
            {topParticipants.map((p) => (
              <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[#7c3aed] text-[10px] font-bold overflow-hidden shadow-sm" title={p.name}>
                {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : p.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowInfo(true)} className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 shrink-0 transition">
          <Shield size={12} /> Rules
        </button>

        <div className="relative shrink-0">
          <button onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition">
            <MoreVertical size={18} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { setShowInfo(true); setShowMenu(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <Info size={16} className="text-[#7c3aed]" /> <span className="text-sm font-semibold text-gray-700">Group Info</span>
                </button>
                {!isGeneral && (
                  <button onClick={() => { setShowAdd(true); setShowMenu(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50 transition-colors">
                    <UserPlus size={16} className="text-[#7c3aed]" /> <span className="text-sm font-semibold text-gray-700">Add Members</span>
                  </button>
                )}
                {!isGeneral && isMember && (
                  <button onClick={() => { setShowMenu(false); handleLeave() }} className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50 text-red-600 transition-colors">
                    <LogOut size={16} /> <span className="text-sm font-bold">Leave Group</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── TRENDING TAGS ─── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-white overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 shrink-0 flex items-center gap-1">
          <Sparkles size={12} className="text-[#7c3aed]"/> Trending
        </span>
        {TRENDING_TAGS.map((tag) => (
          <Link key={tag.label} to={tag.to} className="shrink-0 text-[11px] font-bold rounded-full px-3 py-1 border border-gray-200 bg-white text-gray-600 hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-purple-50 transition-all whitespace-nowrap shadow-sm">
            {tag.label}
          </Link>
        ))}
      </div>

      {/* ─── MESSAGE FEED ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-gray-50/30">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <MessageSquare size={32} className="text-[#7c3aed]" />
            </div>
            <p className="text-lg font-bold text-gray-900">{isGeneral ? 'Welcome to the community!' : 'No posts yet'}</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">{isGeneral ? 'Start the conversation by posting a message below.' : 'Be the first to post in this group.'}</p>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.senderId === user?.uid
          const isAdminMsg = m.senderName?.toLowerCase().includes('skillnest')
          const isEditing = editingId === m.id

          return (
            <article key={m.id} className={`group relative rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                isAdminMsg ? 'border-purple-100 bg-gradient-to-br from-purple-50/50 to-white shadow-sm shadow-[#7c3aed]/5' : 'border-gray-100 bg-white'
              }`}>
              <div className="flex items-start gap-3">
                
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-sm ${
                  isAdminMsg ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {m.senderPhotoURL ? <img src={m.senderPhotoURL} alt="" className="w-full h-full object-cover" /> : m.senderName?.[0]?.toUpperCase() || <User size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm text-gray-900">{m.senderName || 'Anonymous'}</p>
                    {isAdminMsg && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#7c3aed] bg-purple-100 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                        <Sparkles size={10} /> Admin
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-gray-400">{timeAgo(m.createdAt)}</span>
                    
                    {/* 👇 EDITED INDICATOR 👇 */}
                    {m.isEdited && (
                      <span className="text-[10px] font-medium text-gray-400 italic">(edited)</span>
                    )}
                  </div>

                  {/* 👇 CONDITIONAL RENDER: EDIT FORM VS DISPLAY TEXT 👇 */}
                  {isEditing ? (
                    <div className="mt-2 bg-gray-50 border border-[#7c3aed]/30 rounded-xl p-3 shadow-inner">
                      <textarea
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-[#7c3aed] resize-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(m.id)} 
                          disabled={savingEdit || !editText.trim()}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed break-words">
                      {m.body}
                    </p>
                  )}

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => { setReplyTo(m); inputRef.current?.focus() }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-[#7c3aed] transition-colors bg-gray-50 hover:bg-purple-50 px-2 py-1 rounded-md"
                      >
                        <Reply size={12} /> Reply
                      </button>
                      
                      {/* 👇 EDIT & DELETE ACTIONS (ONLY FOR SENDER) 👇 */}
                      {mine && (
                        <>
                          <button
                            onClick={() => startEditing(m)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-2 py-1 rounded-md"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 px-2 py-1 rounded-md"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* ─── COMPOSER ─── */}
      {isMember || isGeneral ? (
        <form onSubmit={handleSend} className="border-t border-gray-200 bg-white p-3 sm:p-4 shrink-0">
          {replyTo && (
            <div className="flex items-start gap-3 mb-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-1 min-w-0 rounded-xl bg-gray-50 border-l-4 border-[#7c3aed] px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed]">
                    Replying to {replyTo.senderName}
                  </p>
                  <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500 text-[10px] font-bold">
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 italic">"{replyTo.body}"</p>
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-2 min-w-0 shrink-0">
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
                placeholder={`Message #${group.name}...`}
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-xl py-3 pl-4 pr-12 text-sm outline-none resize-none transition-all placeholder:text-gray-500"
                style={{ minHeight: 48, maxHeight: 120 }}
              />
            </div>
            
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-12 h-12 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-[#7c3aed]/20 disabled:opacity-50 disabled:shadow-none"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-6 bg-gray-50 text-center text-sm font-semibold text-gray-500 shrink-0">
          You must be a member to post in this group.
        </div>
      )}

      {showInfo && (
        <GroupInfoModal group={group} user={user} onClose={() => setShowInfo(false)} onLeave={handleLeave} onAddMembers={() => { setShowInfo(false); setShowAdd(true) }} />
      )}
      {showAdd && (
        <AddMembersModal group={group} user={user} profile={profile} onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}