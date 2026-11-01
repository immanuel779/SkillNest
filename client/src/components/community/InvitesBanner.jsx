import { UserPlus, Check, X, Shield, Sparkles, Users } from 'lucide-react'

export default function InvitesBanner({ invites, onAccept, onDecline }) {
  if (!invites?.length) return null

  return (
    <div className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-white p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white shadow-md shadow-[#7c3aed]/20 shrink-0">
          <UserPlus size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
            You have {invites.length} pending invite{invites.length === 1 ? '' : 's'}
          </h3>
          <p className="text-[11px] sm:text-xs font-medium text-gray-500">
            Join a community group to connect with peers.
          </p>
        </div>
      </div>

      {/* Invite List */}
      <div className="space-y-3">
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Group Avatar Placeholder */}
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {inv.groupName}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  Invited by <span className="font-semibold text-[#7c3aed]">{inv.invitedByName || 'a member'}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => onAccept(inv)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg px-4 py-2.5 transition-all shadow-md shadow-[#7c3aed]/20 active:scale-95"
              >
                <Check size={14} /> Join Group
              </button>
              <button
                onClick={() => onDecline(inv)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg px-4 py-2.5 transition-all active:scale-95"
              >
                <X size={14} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}