import { useState } from 'react'
import { X, Loader2, Users, Hash, Lock, Globe, Sparkles, CheckCircle2 } from 'lucide-react'
import { createGroup } from '../../services/communityGroupService'
import { useToast } from '../../context/ToastContext'

export default function CreateGroupModal({ user, profile, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Enter a group name')
      return
    }
    setSaving(true)
    try {
      const id = await createGroup({
        name: form.name,
        description: form.description,
        ownerId: user.uid,
        ownerName: profile?.fullName || user.email,
        isPrivate: form.isPrivate,
      })
      toast.success('Group created', form.name)
      onCreated(id)
    } catch (err) {
      toast.error('Could not create', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 relative overflow-hidden shrink-0">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <Users size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Create a Group</h3>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Bring people together around a shared topic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all relative z-10 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── FORM BODY ─── */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Group Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Group Name <span className="text-red-500">*</span>
              </label>
              <span className={`text-[10px] font-bold ${form.name.length >= 80 ? 'text-red-500' : 'text-gray-400'}`}>
                {form.name.length}/80
              </span>
            </div>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all placeholder:font-normal placeholder:text-gray-400"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Lagos Tech Jobs, UI/UX Designers"
                maxLength={80}
                autoFocus
                disabled={saving}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Description <span className="text-gray-400 normal-case font-medium">(Optional)</span>
              </label>
              <span className={`text-[10px] font-bold ${form.description.length >= 300 ? 'text-red-500' : 'text-gray-400'}`}>
                {form.description.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all resize-none placeholder:text-gray-400"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What is this group about? Who should join?"
              maxLength={300}
              disabled={saving}
            />
          </div>

          {/* Privacy Selection Card */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Privacy Setting
            </label>
            
            <div 
              onClick={() => !saving && set('isPrivate', !form.isPrivate)}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                form.isPrivate 
                  ? 'border-[#7c3aed] bg-purple-50/50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                form.isPrivate ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {form.isPrivate ? <Lock size={18} /> : <Globe size={18} />}
              </div>
              
              <div className="flex-1 pt-0.5">
                <p className={`text-sm font-bold ${form.isPrivate ? 'text-[#7c3aed]' : 'text-gray-900'}`}>
                  {form.isPrivate ? 'Private Group' : 'Public Group'}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {form.isPrivate 
                    ? 'Only people you invite can find and join this group.'
                    : 'Anyone in the SkillNest community can find and join this group.'}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <div className={`w-12 h-6 rounded-full flex items-center p-1 shrink-0 transition-colors mt-2 ${
                form.isPrivate ? 'bg-[#7c3aed]' : 'bg-gray-200'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  form.isPrivate ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
            </div>
          </div>

        </div>

        {/* ─── FOOTER ─── */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreate}
            disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50 disabled:shadow-none"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Creating...</>
            ) : (
              <><Sparkles size={16} /> Create Group</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}