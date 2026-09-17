import { useEffect, useState } from 'react'
import {
  Trash2,
  Newspaper,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  listCompanyUpdates,
  deleteCompanyUpdate,
} from '../../services/updateService'
import { friendlyError } from '../../utils/errors'

export default function CompanyUpdateFeed({
  companyId,
  companyOwnerId,
  canPost = false,
  refreshKey = 0,
  onCountChange,
}) {
  const { user } = useAuth()
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const list = await listCompanyUpdates(companyId)
      setUpdates(list)
      onCountChange?.(list.length)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, refreshKey])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return
    try {
      await deleteCompanyUpdate(id)
      load()
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="card text-center py-16">
        <Newspaper size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">No updates yet</p>
        <p className="text-sm text-gray-500 mt-1">
          {canPost
            ? 'Post your first update to let followers know what\'s happening.'
            : 'This company hasn\'t posted any updates yet.'}
        </p>
      </div>
    )
  }

  const isOwner = user?.uid === companyOwnerId

  return (
    <div className="space-y-3">
      {updates.map((u) => (
        <div key={u.id} className="card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {u.createdAt?.seconds && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Calendar size={11} />
                  {new Date(u.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">
                {u.content}
              </p>
              {u.imageUrl && (
                <img
                  src={u.imageUrl}
                  alt=""
                  className="mt-3 rounded-lg max-h-80 w-full object-cover"
                />
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => handleDelete(u.id)}
                className="text-gray-300 hover:text-red-600 transition shrink-0 p-1"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}