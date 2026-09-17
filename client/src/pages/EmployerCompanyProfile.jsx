import { useEffect, useState, useRef } from 'react'
import { Building2, Save, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyCompany, createCompany, updateCompany } from '../services/companyService'
import { uploadImage } from '../services/storageService'

const INDUSTRIES = ['Tech', 'Finance', 'Healthcare', 'Education', 'E-commerce', 'Media', 'Other']
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function EmployerCompanyProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [companyId, setCompanyId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    industry: '',
    description: '',
    location: '',
    website: '',
    companySize: '',
    contactEmail: '',
    contactPhone: '',
  })

  const logoInput = useRef(null)

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
        } else {
          setForm((f) => ({ ...f, contactEmail: user.email || '' }))
        }
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(`logos/${user.uid}`, file)
      update('logoUrl', url)
      // Persist immediately if company already exists
      if (companyId) {
        await updateCompany(companyId, { logoUrl: url })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (logoInput.current) logoInput.current.value = ''
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    try {
      if (companyId) {
        await updateCompany(companyId, form)
      } else {
        const id = await createCompany(user.uid, form)
        setCompanyId(id)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
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

  return (
    <div className="container-app py-10 pb-32 max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-1">Company Profile</h1>
      <p className="text-gray-500 mb-8">This is what candidates see on your job posts.</p>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center overflow-hidden shadow-lg shadow-brand-500/30">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 size={28} className="text-white" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              disabled={uploading}
              className="btn-outline !py-2 !px-3 text-sm"
            >
              <Upload size={14} />{' '}
              {uploading
                ? 'Uploading...'
                : form.logoUrl
                ? 'Change logo'
                : 'Upload logo'}
            </button>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              onChange={onLogo}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-2">PNG, JPG — max 5MB</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <Field label="Company name *">
          <input
            className="input"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Acme Inc."
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Industry">
            <select
              className="input"
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
            >
              <option value="">Select...</option>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="Company size">
            <select
              className="input"
              value={form.companySize}
              onChange={(e) => update('companySize', e.target.value)}
            >
              <option value="">Select...</option>
              {SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Lagos, Nigeria"
            />
          </Field>
          <Field label="Website">
            <input
              className="input"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://acme.com"
            />
          </Field>
          <Field label="Contact email">
            <input
              className="input"
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
            />
          </Field>
          <Field label="Contact phone">
            <input
              className="input"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
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
        <div className="container-app py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {saved && (
              <>
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-green-700 font-medium">Saved</span>
              </>
            )}
          </div>
          <button onClick={handleSave} disabled={saving || uploading} className="btn-primary">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </div>
    </div>
  )
}