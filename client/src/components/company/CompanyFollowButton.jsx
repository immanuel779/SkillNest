import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { followCompany, unfollowCompany, isFollowing } from '../../services/followService'

export default function CompanyFollowButton({ companyId, size = 'md' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user || !companyId) {
        setLoading(false)
        return
      }
      const ok = await isFollowing(user.uid, companyId)
      if (alive) {
        setFollowing(ok)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, companyId])

  const handleClick = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setBusy(true)
    try {
      if (following) {
        await unfollowCompany(user.uid, companyId)
        setFollowing(false)
      } else {
        await followCompany(user.uid, companyId)
        setFollowing(true)
      }
    } finally {
      setBusy(false)
    }
  }

  const base = size === 'sm' ? '!py-2 !px-3 text-sm' : ''

  if (loading) {
    return (
      <button disabled className={`btn-outline ${base}`}>
        <Loader2 size={14} className="animate-spin" /> Loading
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={
        following
          ? `btn-outline ${base} !text-brand-700 !border-brand-300`
          : `btn-primary ${base}`
      }
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : following ? (
        <UserCheck size={14} />
      ) : (
        <UserPlus size={14} />
      )}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}