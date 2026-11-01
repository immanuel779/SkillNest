import { Hash, Users, Lock, Zap, Sparkles, ChevronRight } from 'lucide-react'

export default function GroupSidebar({ groups, activeId, onSelect }) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <Users size={24} className="text-gray-300" />
        </div>
        <p className="text-sm font-bold text-gray-700">No groups yet</p>
        <p className="text-xs mt-1 text-gray-500 max-w-[200px]">Create a new group to start connecting with others.</p>
      </div>
    )
  }

  return (
    <div className="py-2 flex flex-col gap-1 custom-scrollbar">
      <p className="px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
        <Hash size={12} /> Your Channels
      </p>
      
      <div className="px-2 space-y-0.5">
        {groups.map((g) => {
          const isActive = g.id === activeId
          const isGeneral = g.id === 'general' || g.isGeneral
          const initial = (g.name || '?')[0]?.toUpperCase()

          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex gap-3 items-center group relative overflow-hidden ${
                isActive
                  ? 'bg-purple-50/80 shadow-sm'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              {/* Active Left Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#7c3aed] rounded-r-full" />
              )}

              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 overflow-hidden text-sm transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white shadow-md shadow-[#7c3aed]/20'
                    : isGeneral
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 shadow-sm'
                }`}
              >
                {g.photoURL ? (
                  <img src={g.photoURL} alt="" className="w-full h-full object-cover" />
                ) : isGeneral ? (
                  <Sparkles size={16} />
                ) : (
                  initial || '?'
                )}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p
                      className={`text-sm truncate font-bold ${
                        isActive ? 'text-[#7c3aed]' : 'text-gray-800'
                      }`}
                    >
                      {g.name}
                    </p>
                    {g.isPrivate && (
                      <Lock size={10} className="text-gray-400 shrink-0" />
                    )}
                  </div>
                  {/* Optional unread badge placeholder */}
                  {/* <span className="w-2 h-2 rounded-full bg-[#7c3aed] shrink-0" /> */}
                </div>
                
                <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-[#7c3aed]/70 font-medium' : 'text-gray-500'}`}>
                  {g.lastMessage
                    ? `${g.lastSenderName || 'User'}: ${g.lastMessage}`
                    : g.description || 'No messages yet'}
                </p>
                
                <p className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-[#7c3aed]/60' : 'text-gray-400'}`}>
                  {g.memberCount || 0} {g.memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>

              {/* Hover Arrow */}
              <div className={`shrink-0 transition-opacity ${isActive ? 'opacity-100 text-[#7c3aed]' : 'opacity-0 group-hover:opacity-100 text-gray-400'}`}>
                 <ChevronRight size={16} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}