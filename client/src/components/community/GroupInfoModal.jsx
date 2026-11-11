import { X, LogOut, UserPlus, Users, Shield, Sparkles, MessageSquare, Globe } from 'lucide-react'

export default function GroupInfoModal({ group, user, onClose, onLeave, onAddMembers }) {
  const isGeneral = group.id === 'general' || group.isGeneral
  const isOwner = group.ownerId === user.uid

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/5 rounded-full blur-2xl pointer-events-none" />
          
          <h3 className="font-extrabold text-lg text-gray-900 relative z-10 flex items-center gap-2">
            <MessageSquare size={18} className="text-[#7c3aed]" /> Group Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── BODY (AVATAR & INFO) ─── */}
        <div className="p-6 text-center flex flex-col items-center">
          <div
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden ring-4 ring-white ${
              isGeneral
                ? 'bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[#7c3aed]/30'
                : 'bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-900/20'
            }`}
          >
            {group.photoURL ? (
              <img
                src={group.photoURL}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (group.name || '?')[0]?.toUpperCase()
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900 mt-5 leading-tight">
            {group.name}
          </h2>
          
          {group.description ? (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed px-2">
              {group.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic mt-2">No description provided.</p>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {/* 👇 FIXED: Show "Public Channel" for general, otherwise show member count 👇 */}
            {isGeneral ? (
              <p className="text-xs font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-full px-3 py-1 inline-flex items-center gap-1.5 shadow-sm">
                <Globe size={12} /> Public Channel · Everyone
              </p>
            ) : (
              <p className="text-xs font-bold text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                <Users size={12} className="text-gray-500" />
                {group.memberCount || 0} {group.memberCount === 1 ? 'Member' : 'Members'}
              </p>
            )}

            {isOwner && !isGeneral && (
              <p className="text-xs font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                <Shield size={12} /> You are Owner
              </p>
            )}
          </div>

          {isGeneral && (
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] bg-purple-50 border border-purple-100 rounded-full px-3 py-1.5 shadow-sm">
              <Sparkles size={14} className="text-[#7c3aed]" /> Official SkillNest Channel
            </div>
          )}
        </div>

        {/* ─── ACTIONS ─── */}
        <div className="p-6 pt-2 space-y-3 bg-gray-50/50">
          {!isGeneral && (
            <button
              onClick={onAddMembers}
              className="w-full py-3.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/20 transition-all active:scale-[0.98]"
            >
              <UserPlus size={18} /> Invite People
            </button>
          )}
          
          {!isGeneral && (
            <button
              onClick={onLeave}
              className="w-full py-3.5 rounded-xl bg-white border border-red-200 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 transition-all active:scale-[0.98]"
            >
              <LogOut size={18} /> Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}