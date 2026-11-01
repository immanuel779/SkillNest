import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Search,
  UserPlus,
  Loader2,
  Check,
  Users as UsersIcon,
  User as UserIcon,
  Sparkles,
  XCircle,
  CheckCircle2
} from 'lucide-react'
import {
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { inviteToGroup } from '../../services/communityGroupService'
import { useToast } from '../../context/ToastContext'

export default function AddMembersModal({ group, user, profile, onClose }) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)

  // Load users (limited, filtered, and sorted)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), limit(200))
        )
        if (!alive) return
        
        // Filter out current user, existing members, and sort alphabetically
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== user.uid)
          .filter((u) => !(group.memberIds || []).includes(u.id))
          .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
          
        setUsers(list)
      } catch (err) {
        console.warn('load users failed:', err?.message)
        toast.error('Error', 'Failed to load users.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [group.id, group.memberIds, user.uid, toast])

  // Memoized filtering for better performance
  const filtered = useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    )
  }, [users, search])

  // Derived list of actual user objects for the selected array
  const selectedUsers = useMemo(() => {
    return users.filter((u) => selected.includes(u.id))
  }, [users, selected])

  const toggle = (id) => {
    setSelected((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    )
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([])
    } else {
      setSelected(filtered.map((u) => u.id))
    }
  }

  const handleSend = async () => {
    if (selected.length === 0) return
    setSending(true)
    let sent = 0
    for (const uid of selected) {
      try {
        await inviteToGroup({
          groupId: group.id,
          groupName: group.name,
          invitedUserId: uid,
          invitedBy: user.uid,
          invitedByName: profile?.fullName || user.email,
        })
        sent++
      } catch (err) {
        console.warn('invite failed:', err?.message)
      }
    }
    setSending(false)
    toast.success(
      `Sent ${sent} invite${sent === 1 ? '' : 's'}`,
      'They will see it in their notifications.'
    )
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <UserPlus size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Add Members</h3>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Invite people to <span className="text-[#7c3aed] font-bold">"{group.name}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── SEARCH & ACTIONS ─── */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              autoFocus
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs font-semibold text-gray-500">
              {filtered.length} user{filtered.length === 1 ? '' : 's'} found
            </p>
            {filtered.length > 0 && (
              <button 
                onClick={toggleAll}
                className="text-xs font-bold text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-1 transition-colors"
              >
                {selected.length === filtered.length ? (
                  <><XCircle size={14} /> Deselect All</>
                ) : (
                  <><CheckCircle2 size={14} /> Select All</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ─── USER LIST ─── */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon size={32} className="text-gray-300" />
              </div>
              <p className="font-bold text-gray-800">No users found</p>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Try adjusting your search terms.' : 'All available users are already in this group.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.slice(0, 100).map((u) => {
                const isSelected = selected.includes(u.id)
                return (
                  <li key={u.id}>
                    <button
                      onClick={() => toggle(u.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 border ${
                        isSelected 
                          ? 'bg-purple-50/80 border-[#7c3aed]/30 shadow-sm' 
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden transition-all ${
                        isSelected ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9]' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.fullName?.[0]?.toUpperCase() || <UserIcon size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#7c3aed]' : 'text-gray-900'}`}>
                          {u.fullName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {u.email}
                        </p>
                      </div>
                      
                      {/* Custom Checkbox Circle */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'border-[#7c3aed] bg-[#7c3aed]' 
                          : 'border-gray-300 group-hover:border-gray-400'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ─── SELECTED USERS PREVIEW BAR ─── */}
        {selected.length > 0 && (
          <div className="px-4 py-3 bg-[#7c3aed]/5 border-t border-[#7c3aed]/10 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-[#7c3aed] shrink-0 mr-1">
                {selected.length} Selected:
              </span>
              {selectedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-1 bg-white border border-[#7c3aed]/20 rounded-full pl-1 pr-2 py-1 shrink-0 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[9px] flex items-center justify-center font-bold overflow-hidden">
                    {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover"/> : u.fullName?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 max-w-[80px] truncate">{u.fullName?.split(' ')[0]}</span>
                  <button onClick={() => toggle(u.id)} className="text-gray-400 hover:text-red-500 ml-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── FOOTER ACTIONS ─── */}
        <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selected.length === 0}
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50 disabled:shadow-none"
          >
            {sending ? (
              <><Loader2 size={16} className="animate-spin" /> Sending Invites...</>
            ) : (
              <><Sparkles size={16} /> Send {selected.length > 0 ? selected.length : ''} Invite{selected.length === 1 ? '' : 's'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}