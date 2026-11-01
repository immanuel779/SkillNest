import { useState, useRef } from 'react'
import {
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { submitAd } from '../../services/adsService'
import { uploadImage } from '../../services/storageService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function Field({ label, hint, children, required }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function AdSubmissionForm({ pkg, onClose, onSubmitted }) {
  const { user, profile } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    businessName: '',
    headline: '',
    description: '',
    subtext: '',
    ctaText: 'Learn More',
    ctaUrl: '',
    showOnDashboard: false,
  })
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5MB')
      return
    }
    setUploadingLogo(true)
    setError('')
    try {
      const url = await uploadImage(`ads/${user.uid}/logos`, file)
      setLogoUrl(url)
    } catch (err) {
      setError('Logo upload failed: ' + err.message)
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setError('Banner must be under 8MB')
      return
    }
    setUploadingBanner(true)
    setError('')
    try {
      const url = await uploadImage(`ads/${user.uid}/banners`, file)
      setBannerUrl(url)
    } catch (err) {
      setError('Banner upload failed: ' + err.message)
    } finally {
      setUploadingBanner(false)
      if (bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')

    if (!form.businessName.trim()) return setError('Enter your business name')
    if (!form.headline.trim()) return setError('Write a headline')
    if (!form.ctaUrl.trim()) return setError('Add a destination URL')
    if (!logoUrl) return setError('Please upload your logo')

    try {
      const url = form.ctaUrl.startsWith('http')
        ? form.ctaUrl
        : `https://${form.ctaUrl}`
      new URL(url)
    } catch {
      return setError('Enter a valid URL (e.g. https://your-business.com)')
    }

    setSubmitting(true)
    try {
      const ctaUrl = form.ctaUrl.startsWith('http')
        ? form.ctaUrl
        : `https://${form.ctaUrl}`

      const submissionId = await submitAd({
        userId: user.uid,
        userEmail: user.email,
        userName: profile?.fullName || user.email,
        businessName: form.businessName,
        headline: form.headline,
        description: form.description,
        subtext: form.subtext,
        logoUrl,
        imageUrl: bannerUrl,
        ctaText: form.ctaText,
        ctaUrl,
        packageId: pkg.id,
        packageName: pkg.name,
        price: pkg.price,
        currency: pkg.currency,
        durationDays: pkg.durationDays,
        showOnDashboard: form.showOnDashboard,
      })

      onSubmitted?.(submissionId, pkg)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const uploading = uploadingLogo || uploadingBanner

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[92vh] overflow-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg">Submit your ad</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {pkg.name} plan · ₦{pkg.price.toLocaleString()} ·{' '}
                {pkg.durationDays} days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Logo Upload */}
          <Field label="Logo" required hint="Square PNG or JPG works best · max 5MB">
            {logoUrl ? (
              <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950 flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-contain bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    ✅ Logo uploaded
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Looking good! You can replace it anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 transition p-6 text-center disabled:opacity-50"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-2">
                  {uploadingLogo ? (
                    <Loader2 size={20} className="text-brand-700 animate-spin" />
                  ) : (
                    <ImageIcon size={20} className="text-brand-700 dark:text-brand-400" />
                  )}
                </div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {uploadingLogo ? 'Uploading…' : 'Click to upload your logo'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  PNG, JPG, SVG — max 5MB
                </p>
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </Field>

          {/* Banner Upload */}
          <Field
            label="Banner image"
            hint="Optional. Wide image (1200×400 recommended). Shown on Basic and above · max 8MB"
          >
            {bannerUrl ? (
              <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-950">
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="w-full max-h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/30 transition p-5 text-center disabled:opacity-50"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-2">
                  {uploadingBanner ? (
                    <Loader2 size={20} className="text-brand-700 animate-spin" />
                  ) : (
                    <Upload size={20} className="text-brand-700 dark:text-brand-400" />
                  )}
                </div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {uploadingBanner ? 'Uploading…' : 'Click to upload banner'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  PNG, JPG, WEBP — max 8MB
                </p>
              </button>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </Field>

          <Field label="Business name" required hint="Shown in small caps above the headline">
            <input
              className="input"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
              placeholder="e.g. LONERTECH LTD"
              maxLength={100}
            />
          </Field>

          <Field label="Headline" required hint="The main message — max 200 chars">
            <input
              className="input"
              value={form.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder="A website that actually gets found on Google"
              maxLength={200}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              className="input resize-none"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Short description of your product or service..."
              maxLength={400}
            />
          </Field>

          <Field label="Subtext" hint="Small details — user count, features, etc.">
            <input
              className="input"
              value={form.subtext}
              onChange={(e) => set('subtext', e.target.value)}
              placeholder="50,000+ users · 9 search disciplines · Lagos"
              maxLength={200}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Button text">
              <input
                className="input"
                value={form.ctaText}
                onChange={(e) => set('ctaText', e.target.value)}
                placeholder="Get a free audit"
                maxLength={40}
              />
            </Field>
            <Field label="Destination URL" required>
              <input
                className="input"
                value={form.ctaUrl}
                onChange={(e) => set('ctaUrl', e.target.value)}
                placeholder="https://your-business.com"
              />
            </Field>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-brand-300">
            <input
              type="checkbox"
              checked={form.showOnDashboard}
              onChange={(e) => set('showOnDashboard', e.target.checked)}
              className="w-4 h-4 accent-brand-600 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                Also show in user dashboards
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Increases visibility — your ad appears on the job seeker and
                employer dashboards too.
              </p>
            </div>
          </label>

          <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-3 text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Next step:</strong> After submitting, you'll see payment
            instructions. Once we confirm payment, your ad goes live within
            24 hours.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>Continue to payment</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}