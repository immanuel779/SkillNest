import { useState } from 'react'
import { Megaphone, Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import { notifyCompanyFollowers } from '../../services/notificationService'
import { uploadImage } from '../../services/storageService'
import { friendlyError } from '../../utils/errors'

const MAX_CHARS = 1000
const MAX_IMAGE_MB = 4

export default function CompanyUpdateComposer({ company, onPosted }) {
  const { user, profile } = useAuth()
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  if (!company || !user) return null

  const reset = () => {
    setTitle('')
    setBody('')
    setImageFile(null)
    setImagePreview('')
    setError('')
    setExpanded(false)
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_MB}MB`)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
  }

  const handlePost = async () => {
    setError('')
    const trimmedBody = body.trim()
    if (!trimmedBody) {
      setError('Write something first.')
      return
    }
    if (trimmedBody.length > MAX_CHARS) {
      setError(`Update is too long. Max ${MAX_CHARS} characters.`)
      return
    }

    setPosting(true)
    try {
      let imageUrl = ''
      if (imageFile) {
        imageUrl = await uploadImage(
          `company-updates/${company.id}`,
          imageFile
        )
      }

      const ref = await addDoc(collection(db, 'companyUpdates'), {
        companyId: company.id,
        companyName: company.name || '',
        companyLogoUrl: company.logoUrl || '',
        authorId: user.uid,
        authorName: profile?.fullName || user.email || 'Team',
        title: title.trim().slice(0, 120),
        body: trimmedBody,
        imageUrl,
        createdAt: serverTimestamp(),
      })

      // Notify followers — best-effort
      notifyCompanyFollowers(company.id, {
        type: 'company_update',
        title: title.trim() || `${company.name} posted an update`,
        body: trimmedBody.slice(0, 140),
        link: company.slug ? `/c/${company.slug}` : '/companies',
      }).catch(() => {})

      reset()
      onPosted?.(ref.id)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Megaphone size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            Post an update to your followers
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Share news, milestones, or announcements.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {expanded && (
        <input
          className="input mb-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline (optional) — e.g. 'We're hiring!'"
          maxLength={120}
        />
      )}

      <textarea
        rows={expanded ? 6 : 3}
        className="input resize-none"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setExpanded(true)}
        placeholder="What's new at your company?"
        maxLength={MAX_CHARS}
      />

      <div className="flex items-center justify-between gap-2 mt-2 text-xs">
        <span
          className={
            body.length > MAX_CHARS * 0.9
              ? 'text-red-600 font-semibold'
              : 'text-gray-400'
          }
        >
          {body.length}/{MAX_CHARS}
        </span>

        {expanded && (
          <button
            type="button"
            onClick={reset}
            className="text-gray-400 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>

      {imagePreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200">
          <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-cover" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-brand-700 cursor-pointer">
          <ImageIcon size={14} />
          Add image
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="hidden"
          />
        </label>

        <button
          onClick={handlePost}
          disabled={posting || !body.trim()}
          className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
        >
          {posting ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Posting...
            </>
          ) : (
            <>
              <Megaphone size={14} /> Post update
            </>
          )}
        </button>
      </div>
    </div>
  )
}