import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { Trash2, Megaphone, Loader2 } from 'lucide-react'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { friendlyError } from '../../utils/errors'

export default function CompanyUpdateFeed({
  companyId,
  companyOwnerId,
  canPost = false,
  refreshKey = 0,
}) {
  const { user } = useAuth()
  const toast = useToast()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    const q = query(
      collection(db, 'companyUpdates'),
      where('companyId', '==', companyId)
    )
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0
        const tb = b.createdAt?.seconds || 0
        return tb - ta
      })
      setUpdates(items)
      setLoading(false)
    })
    return unsub
  }, [companyId, refreshKey])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return
    try {
      await deleteDoc(doc(db, 'companyUpdates', id))
      toast.success('Update deleted')
    } catch (err) {
      toast.error('Could not delete', friendlyError(err))
    }
  }

  const canDelete = (u) =>
    canPost && (u.authorId === user?.uid || companyOwnerId === user?.uid)

  if (loading) {
    return (
      <div className="card text-center py-8">
        <Loader2 size={20} className="mx-auto animate-spin text-gray-400" />
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <Megaphone size={32} className="mx-auto mb-2 opacity-60" />
        <p className="text-sm">No updates yet</p>
        <p className="text-xs mt-1">Posts will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {updates.map((u) => (
        <article key={u.id} className="card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
              {u.companyLogoUrl ? (
                <img
                  src={u.companyLogoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Megaphone size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {u.companyName || 'Company'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {u.authorName && `by ${u.authorName} · `}
                {u.createdAt?.seconds
                  ? new Date(u.createdAt.seconds * 1000).toLocaleString()
                  : ''}
              </p>
            </div>
            {canDelete(u) && (
              <button
                onClick={() => handleDelete(u.id)}
                className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {u.title && (
            <h3 className="font-bold text-gray-900 text-lg mb-1">{u.title}</h3>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {u.body}
          </p>

          {u.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
              <img
                src={u.imageUrl}
                alt=""
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </article>
      ))}
    </div>
  )
}