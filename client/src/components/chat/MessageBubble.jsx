import { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { editMessage, deleteMessage } from '../../services/messageService'
import { useToast } from '../../context/ToastContext'

export default function MessageBubble({ message, mine }) {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.body)
  const [saving, setSaving] = useState(false)
  const editRef = useRef(null)

  // Auto-focus the input when editing starts
  useEffect(() => {
    if (isEditing) {
      editRef.current?.focus()
      editRef.current?.setSelectionRange(editText.length, editText.length)
    }
  }, [isEditing, editText.length])

  const time = message.createdAt?.seconds 
    ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '...'

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === message.body) {
      setIsEditing(false)
      return
    }
    setSaving(true)
    try {
      await editMessage(message.id, editText)
      setIsEditing(false)
    } catch (err) {
      toast.error('Failed to edit', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this message? This will remove it for everyone.')) return
    try {
      await deleteMessage(message.id)
    } catch (err) {
      toast.error('Failed to delete', err.message)
    }
  }

  return (
    <div className={`flex flex-col group ${mine ? 'items-end' : 'items-start'} w-full`}>
      
      <div className={`relative max-w-[85%] sm:max-w-[70%] flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Message Bubble */}
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative transition-all ${
          mine 
            ? 'bg-[#7c3aed] text-white rounded-tr-sm' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
        }`}>
          
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[300px]">
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveEdit()
                  }
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-lg p-2 text-sm outline-none resize-none"
                rows={2}
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-white/80 hover:text-white px-2 py-1 rounded transition-colors">
                  <X size={12} /> Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1 bg-white text-[#7c3aed] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
              
              <div className={`flex items-center justify-end gap-1.5 mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                {message.isEdited && <span className="text-[10px] italic">(edited)</span>}
                <span className="text-[10px]">{time}</span>
                {mine && (
                  <span className="text-[10px] font-bold tracking-tighter">
                    ✓✓
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Hover Actions (Edit / Delete) */}
        {!isEditing && (
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
            mine ? 'flex-row-reverse' : 'flex-row'
          }`}>
            {mine && (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 flex items-center justify-center transition-colors"
                  title="Edit message"
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
                  title="Delete message"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}