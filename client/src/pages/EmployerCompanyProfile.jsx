import { useEffect, useState, useRef } from 'react'
import {
  Building2,
  Save,
  Upload,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getMyCompany,
  createCompany,
  updateCompany,
  setCompanySlug,
} from '../services/companyService'
import { uploadImage } from '../services/storageService'
import {
  toSlug,
  isSlugFormatValid,
  slugErrorReason,
  isSlugAvailable,
} from '../services/slugService'
import { friendlyError } from '../utils/errors'

const INDUSTRIES = ['Tech', 'Finance', 'Healthcare', 'Education', 'E-commerce', 'Media', 'Other']
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

export default function EmployerCompanyProfile() {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState('')
  const [companyId, setCompanyId] = useState(null)
  const [slugStatus, setSlugStatus] = useState({ checked: false, available: false })
  const [slugCheckKey, setSlugCheckKey] = useState(0)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    logoUrl: '',
    coverUrl: '',
    industry: '',
    description: '',
    location: '',
    website: '',
    companySize: '',
    contactEmail: '',
    contactPhone: '',
  })

  const logoInput = useRef(null)
  const coverInput = useRef(null)
  const originalSlugRef = useRef('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const c = await getMyCompany(user.uid)
        if (!alive) return
        if (c) {
          setCompanyId(c.id)
          setForm((f) => ({ ...f, ...c }))
          originalSlugRef.current = c.slug || ''
        } else {
          setForm((f) => ({ ...f, contactEmail: user.email || '' }))
        }
      } catch (err) {
        if (alive) setError(friendlyError(err))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  // Slug availability check (debounced)
  useEffect(() => {
    if (!form.slug) {
      setSlugStatus({ checked: false, available: false })
      return
    }
    if (!isSlugFormatValid(form.slug)) {
      setSlugStatus({ checked: true, available: false })
      return
    }
    if (form.slug === originalSlugRef.current) {
      setSlugStatus({ checked: true, available: true })
      return
    }
    let alive = true
    const t = setTimeout(async () => {
      const ok = await isSlugAvailable(form.slug)
      if (alive) setSlugStatus({ checked: true, available: ok })
    }, 400)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [form.slug, slugCheckKey])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onNameChange = (v) => {
    update('name', v)
    if (!companyId && !form.slug) {
      update('slug', toSlug(v))
    }
  }

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingLogo(true)
    try {
      const url = await uploadImage(`logos/${user.uid}`, file)
      update('logoUrl', url)
      if (companyId) await updateCompany(companyId, { logoUrl: url })
      toast.success('Logo updated')
    } catch (err) {
      toast.error('Upload failed', friendlyError(err))
    } finally {
      setUploadingLogo(false)
      if (logoInput.current) logoInput.current.value = ''
    }
  }

  const onCover = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingCover(true)
    try {
      const url = await uploadImage(`covers/${user.uid}`, file)
      update('coverUrl', url)
      if (companyId) await updateCompany(companyId, { coverUrl: url })
      toast.success('Cover updated')
    } catch (err) {
      toast.error('Upload failed', friendlyError(err))
    } finally {
      setUploadingCover(false)
      if (coverInput.current) coverInput.current.value = ''
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) {
      setError('Company name is required.')
      return
    }
    if (!form.slug || !isSlugFormatValid(form.slug)) {
      setError(slugErrorReason(form.slug))
      return
    }
    if (form.slug !== originalSlugRef.current && !slugStatus.available) {
      setError('That URL is already taken. Try another.')
      return
    }
    setSaving(true)
    try {
      let id = companyId
      const { slug: formSlug, ...rest } = form

      if (id) {
        await updateCompany(id, rest)
        if (formSlug !== originalSlugRef.current) {
          const finalSlug = await setCompanySlug(
            id,
            user.uid,
            formSlug,
            originalSlugRef.current
          )
          originalSlugRef.current = finalSlug
          update('slug', finalSlug)
        }
      } else {
        const newId = await createCompany(user.uid, rest)
        id = newId
        setCompanyId(newId)
        const finalSlug = await setCompanySlug(newId, user.uid, formSlug)
        originalSlugRef.current = finalSlug
        update('slug', finalSlug)
      }
      toast.success('Company saved', 'Your profile is up to date.')
    } catch (err) {
      toast.error('Save failed', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const slugValid = isSlugFormatValid(form.slug)
  const slugUnchanged = form.slug === originalSlugRef.current
  const slugOK = slugUnchanged || (slugStatus.checked && slugStatus.available)
  const publicUrl = form.slug ? `${window.location.origin}/c/${form.slug}` : ''

  return (
    <div className="container-app py-10 pb-32 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Company Profile</h1>
          <p className="text-gray-500">This is what candidates see.</p>
        </div>
        {originalSlugRef.current && (
          <a
            href={`/c/${originalSlugRef.current}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <ExternalLink size={14} /> Preview my space
          </a>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Cover */}
      <div className="card !p-0 mb-6 overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-brand-600 to-brand-900">
          {form.coverUrl && (
            <img
              src={form.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={uploadingCover}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-800 hover:bg-white transition inline-flex items-center gap-1.5"
          >
            <Upload size={12} /> {form.coverUrl ? 'Change cover' : 'Upload cover'}
          </button>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            onChange={onCover}
            className="hidden"
          />
        </div>
        <div className="p-5 flex items-center gap-5 -mt-12">
          <div className="relative w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                <Building2 size={28} className="text-white" />
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="pt-10">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              disabled={uploadingLogo}
              className="btn-outline !py-2 !px-3 text-sm"
            >
              <Upload size={14} /> {uploadingLogo ? 'Uploading...' : form.logoUrl ? 'Change logo' : 'Upload logo'}
            </button>
            <input ref={logoInput} type="file" accept="image/*" onChange={onLogo} className="hidden" />
            <p className="text-xs text-gray-400 mt-1.5">PNG, JPG — max 5MB</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <Field label="Company name *">
          <input
            className="input"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Acme Inc."
          />
        </Field>

        <Field
          label="Public URL *"
          hint={
            form.slug
              ? slugUnchanged
                ? `Your space: ${publicUrl}`
                : !slugValid
                ? slugErrorReason(form.slug)
                : !slugStatus.checked
                ? 'Checking availability...'
                : slugStatus.available
                ? `✓ ${publicUrl} is available`
                : 'That URL is taken. Try adding a number or word.'
              : 'Example: acme-inc → /c/acme-inc'
          }
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
              /c/
            </span>
            <input
              className={`input pl-10 ${
                form.slug && !slugValid ? '!border-red-300' : ''
              }`}
              value={form.slug}
              onChange={(e) => update('slug', toSlug(e.target.value))}
              placeholder="acme-inc"
            />
          </div>
        </Field>

        <Field label="Tagline" hint="One line that summarises what you do. Max 120 characters.">
          <input
            className="input"
            value={form.tagline}
            onChange={(e) => update('tagline', e.target.value.slice(0, 120))}
            placeholder="Building tools for African developers."
            maxLength={120}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Industry">
            <select className="input" value={form.industry} onChange={(e) => update('industry', e.target.value)}>
              <option value="">Select...</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="Company size">
            <select className="input" value={form.companySize} onChange={(e) => update('companySize', e.target.value)}>
              <option value="">Select...</option>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <input className="input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Lagos, Nigeria" />
          </Field>
          <Field label="Website">
            <input className="input" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://acme.com" />
          </Field>
          <Field label="Contact email">
            <input className="input" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
          </Field>
          <Field label="Contact phone">
            <input className="input" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
          </Field>
        </div>

        <Field label="About the company">
          <textarea
            rows={5}
            className="input resize-none"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What does your company do?"
          />
        </Field>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="container-app py-3 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={saving || uploadingLogo || uploadingCover || (form.slug !== originalSlugRef.current && !slugOK)}
            className="btn-primary"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </div>
    </div>
  )
}