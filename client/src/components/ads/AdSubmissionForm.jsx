import { useState, useRef } from 'react'
import {
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { submitAd } from '../../services/adsService'
import { uploadImage } from '../../services/storageService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function Field({ label, hint, children, required, count, max }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {max && (
          <span className={`text-[10px] font-bold ${count > max ? 'text-red-500' : 'text-gray-400'}`}>
            {count || 0}/{max}
          </span>
        )}
      </div>
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
    if (file.size > 5 * 1024 * 1024) return setError('Logo must be under 5MB')
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
    if (file.size > 8 * 1024 * 1024) return setError('Banner must be under 8MB')
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
      const url = form.ctaUrl.startsWith('http') ? form.ctaUrl : `https://${form.ctaUrl}`
      new URL(url)
    } catch {
      return setError('Enter a valid URL (e.g. https://your-business.com)')
    }

    setSubmitting(true)
    try {
      const ctaUrl = form.ctaUrl.startsWith('http') ? form.ctaUrl : `https://${form.ctaUrl}`

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
        ctaText: form.ctaText || 'Learn More',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center shadow-md shadow-[#7c3aed]/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl text-gray-900">Create your Ad</h3>
              <p className="text-xs font-semibold text-[#7c3aed] mt-0.5">
                {pkg.name} Plan • ₦{pkg.price.toLocaleString()} • {pkg.durationDays} Days
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid lg:grid-cols-2 gap-0 h-full">
            
            {/* LEFT: FORM */}
            <div className="p-6 sm:p-8 space-y-6 border-r border-gray-100">
              {error && (
                <div className="flex items-start gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Company Logo" required hint="Max 5MB">
                  {logoUrl ? (
                    <div className="relative rounded-xl border border-gray-200 p-3 bg-white shadow-sm flex items-center justify-center h-32 group">
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      <button type="button" onClick={() => setLogoUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7c3aed] hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 group">
                      {uploadingLogo ? <Loader2 size={24} className="text-[#7c3aed] animate-spin" /> : <ImageIcon size={24} className="text-gray-400 group-hover:text-[#7c3aed]" />}
                      <span className="text-xs font-bold text-gray-500 group-hover:text-[#7c3aed]">Upload Logo</span>
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </Field>

                <Field label="Banner Image" hint="Optional · Max 8MB">
                  {bannerUrl ? (
                    <div className="relative rounded-xl border border-gray-200 p-2 bg-white shadow-sm flex items-center justify-center h-32 group">
                      <img src={bannerUrl} alt="Banner" className="max-w-full max-h-full object-cover rounded-md" />
                      <button type="button" onClick={() => setBannerUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7c3aed] hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 group">
                      {uploadingBanner ? <Loader2 size={24} className="text-[#7c3aed] animate-spin" /> : <Upload size={24} className="text-gray-400 group-hover:text-[#7c3aed]" />}
                      <span className="text-xs font-bold text-gray-500 group-hover:text-[#7c3aed]">Upload Banner</span>
                    </button>
                  )}
                  <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                </Field>
              </div>

              <div className="space-y-4">
                <Field label="Business Name" required max={100} count={form.businessName.length}>
                  <input className="input font-semibold" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. LONERTECH LTD" maxLength={100} />
                </Field>

                <Field label="Headline" required max={200} count={form.headline.length} hint="Grab attention instantly">
                  <input className="input font-bold text-lg" value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="A website that actually gets found on Google" maxLength={200} />
                </Field>

                <Field label="Description" max={400} count={form.description.length}>
                  <textarea rows={2} className="input resize-none" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description of your product or service..." maxLength={400} />
                </Field>

                <Field label="Subtext" max={200} count={form.subtext.length} hint="Small details (e.g. 50,000+ users)">
                  <input className="input" value={form.subtext} onChange={(e) => set('subtext', e.target.value)} placeholder="50,000+ users · 9 search disciplines" maxLength={200} />
                </Field>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Button Text">
                  <input className="input font-bold" value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} placeholder="Get a free audit" maxLength={40} />
                </Field>
                <Field label="Destination URL" required>
                  <input className="input" value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} placeholder="https://your-business.com" />
                </Field>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-[#7c3aed] hover:bg-purple-50/50 transition-colors">
                <input type="checkbox" checked={form.showOnDashboard} onChange={(e) => set('showOnDashboard', e.target.checked)} className="w-5 h-5 accent-[#7c3aed] mt-0.5 rounded" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Show in User Dashboards</p>
                  <p className="text-xs text-gray-500 mt-0.5">Increases visibility dramatically by showing your ad to active users.</p>
                </div>
              </label>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="bg-gray-50/80 p-6 sm:p-8 flex flex-col h-full border-t lg:border-t-0">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={18} className="text-[#7c3aed]" />
                <h4 className="font-extrabold text-gray-900 uppercase tracking-wide text-sm">Live Ad Preview</h4>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
                  {bannerUrl && (
                    <div className="w-full h-32 bg-gray-100 relative">
                      <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                        SPONSORED
                      </div>
                    </div>
                  )}

                  <div className="p-6 relative">
                    {!bannerUrl && (
                      <div className="absolute -top-8 left-6 w-16 h-16 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden p-2">
                        {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-300" />}
                      </div>
                    )}

                    <div className={`flex items-start gap-4 ${!bannerUrl ? 'mt-8' : ''}`}>
                      {bannerUrl && (
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                          {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-gray-300" />}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-[#7c3aed] uppercase tracking-wider mb-1">
                          {form.businessName || 'YOUR BUSINESS NAME'}
                        </p>
                        <h3 className="font-extrabold text-gray-900 text-lg leading-tight truncate">
                          {form.headline || 'Your Amazing Headline Goes Here'}
                        </h3>
                        
                        {(form.description || form.subtext) && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {form.description || form.subtext || 'Your description will appear here to convince users to click.'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                        <CheckCircle2 size={12} className="text-green-500" /> Verified Ad
                      </div>
                      <button className="bg-[#0f172a] hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-1.5 pointer-events-none">
                        {form.ctaText || 'Learn More'} <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs text-yellow-800 leading-relaxed">
                  <strong>Note:</strong> Your ad will undergo a quick review by our team. Once approved, you'll receive payment instructions and your ad will go live!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="btn-outline !px-6">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !px-8 shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting...</>
            ) : (
              <><CheckCircle2 size={16} /> Submit Ad for Review</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}