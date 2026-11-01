import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  X,
  Save,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMyCompany } from '../services/companyService'
import { createJob, updateJob, getJob } from '../services/jobService'
import AIJobDescriptionWriter from '../components/ai/AIJobDescriptionWriter'
import VerifyEmailBanner from '../components/VerifyEmailBanner'
import { CURRENCIES, getCurrencySymbol } from '../utils/currency'

const JOB_TYPES = [
  { v: 'full_time', l: 'Full-time' },
  { v: 'part_time', l: 'Part-time' },
  { v: 'contract', l: 'Contract' },
  { v: 'internship', l: 'Internship' },
  { v: 'temporary', l: 'Temporary' },
]
const WORK_MODES = [
  { v: 'onsite', l: 'On-site' },
  { v: 'remote', l: 'Remote' },
  { v: 'hybrid', l: 'Hybrid' },
]
const EXPERIENCE = [
  { v: 'entry', l: 'Entry level' },
  { v: 'mid', l: 'Mid level' },
  { v: 'senior', l: 'Senior' },
  { v: 'lead', l: 'Lead' },
  { v: 'executive', l: 'Executive' },
]

function Section({ title, children }) {
  return (
    <div className="card mb-6">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function parseAIJobDescription(text) {
  if (!text) return { description: '', responsibilities: '', requirements: '' }

  const lines = text.split('\n')
  const sections = {
    ABOUT: [],
    RESPONSIBILITIES: [],
    REQUIREMENTS: [],
    OTHER: [],
  }
  let current = 'ABOUT'

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const upper = line.toUpperCase()
    if (upper.startsWith('ABOUT THE ROLE') || upper === 'ABOUT THE ROLE:') {
      current = 'ABOUT'
      continue
    }
    if (upper.startsWith('RESPONSIBILITIES')) {
      current = 'RESPONSIBILITIES'
      continue
    }
    if (upper.startsWith('REQUIREMENTS')) {
      current = 'REQUIREMENTS'
      continue
    }
    if (upper.startsWith('NICE TO HAVE')) {
      current = 'REQUIREMENTS'
      sections.REQUIREMENTS.push('Nice to have:')
      continue
    }
    sections[current].push(line)
  }

  return {
    description: sections.ABOUT.join('\n').trim(),
    responsibilities: sections.RESPONSIBILITIES.join('\n').trim(),
    requirements: sections.REQUIREMENTS.join('\n').trim(),
  }
}

export default function EmployerPostJob() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: jobId } = useParams()
  const isEdit = !!jobId

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    responsibilities: '',
    requirements: '',
    skills: [],
    jobType: 'full_time',
    workMode: 'remote',
    location: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'NGN',
    experienceLevel: 'mid',
    applicationDeadline: '',
    status: 'draft',
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const c = await getMyCompany(user.uid)
        if (!alive) return
        setCompany(c)
        if (isEdit) {
          const j = await getJob(jobId)
          if (!alive) return
          if (j && j.ownerId === user.uid) {
            setForm((f) => ({ ...f, ...j }))
          } else {
            setError('Job not found or you do not own it')
          }
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
  }, [user, jobId, isEdit])

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s) return
    if (form.skills.includes(s)) return
    update('skills', [...form.skills, s])
    setSkillInput('')
  }

  const removeSkill = (s) => update('skills', form.skills.filter((x) => x !== s))

  const handleSave = async (publish = false) => {
    setError('')

    if (!form.title.trim()) {
      setError('Job title is required')
      return
    }
    if (!form.description.trim()) {
      setError('Description is required')
      return
    }
    if (!company) {
      setError('Please create your company profile first')
      return
    }

    // ── VERIFICATION GATE ──
    if (publish && !company.verified) {
      setError('Your company must be verified before publishing a job. Please go to Dashboard and click "Get Verified".')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        status: publish ? 'published' : form.status,
      }
      if (isEdit) {
        await updateJob(jobId, payload)
      } else {
        await createJob(user.uid, company.id, company.name, payload)
      }
      navigate('/employer/jobs')
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

  if (!company) {
    return (
      <div className="container-app py-16 max-w-2xl">
        <div className="card text-center">
          <h2 className="text-xl font-bold">Create your company profile first</h2>
          <p className="text-gray-500 mt-2">
            You need a company profile before posting jobs.
          </p>
          <button
            onClick={() => navigate('/employer/company')}
            className="btn-primary mt-6"
          >
            Create company profile
          </button>
        </div>
      </div>
    )
  }

  const symbol = getCurrencySymbol(form.currency)

  return (
    <div className="container-app py-10 pb-32 max-w-3xl">
      <button
        onClick={() => navigate('/employer/jobs')}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> Back to jobs
      </button>

      <VerifyEmailBanner />

      {/* VERIFICATION BANNER */}
      {!company.verified && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
            <Lock size={20} className="text-yellow-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">Verification Required</p>
            <p className="mt-1 text-yellow-700">
              To protect job seekers, your company must be verified before you can publish a job. You can still save this job as a draft.
            </p>
          </div>
          <Link to="/employer/verification" className="btn-primary !bg-yellow-500 hover:!bg-yellow-600 !text-white !border-transparent shrink-0 mt-3 sm:mt-0 w-full sm:w-auto text-center justify-center">
            Get Verified Now
          </Link>
        </div>
      )}

      <h1 className="text-3xl font-extrabold mb-1">
        {isEdit ? 'Edit Job' : 'Post a Job'}
      </h1>
      <p className="text-gray-500 mb-8">
        {isEdit
          ? 'Update this job posting.'
          : 'Fill in the details to publish a new role.'}
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Section title="Role basics">
        <Field label="Job title *">
          <input
            className="input"
            value={form.title || ''}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Senior Frontend Engineer"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Category">
            <input
              className="input"
              value={form.category || ''}
              onChange={(e) => update('category', e.target.value)}
              placeholder="Engineering"
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location || ''}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Remote / Lagos"
            />
          </Field>
          <Field label="Job type">
            <select
              className="input"
              value={form.jobType}
              onChange={(e) => update('jobType', e.target.value)}
            >
              {JOB_TYPES.map((j) => (
                <option key={j.v} value={j.v}>
                  {j.l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Work mode">
            <select
              className="input"
              value={form.workMode}
              onChange={(e) => update('workMode', e.target.value)}
            >
              {WORK_MODES.map((w) => (
                <option key={w.v} value={w.v}>
                  {w.l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Experience level">
            <select
              className="input"
              value={form.experienceLevel}
              onChange={(e) => update('experienceLevel', e.target.value)}
            >
              {EXPERIENCE.map((e) => (
                <option key={e.v} value={e.v}>
                  {e.l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Application deadline">
            <input
              type="date"
              className="input"
              value={form.applicationDeadline || ''}
              onChange={(e) => update('applicationDeadline', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Compensation">
        <Field label="Currency">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.map((c) => {
              const active = form.currency === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => update('currency', c.code)}
                  className={`px-3 py-2.5 rounded-lg border-2 text-left transition ${
                    active
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        active ? 'text-brand-700' : 'text-gray-700'
                      }`}
                    >
                      {c.symbol}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        active ? 'text-brand-800' : 'text-gray-700'
                      }`}
                    >
                      {c.code}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {c.label}
                  </p>
                </button>
              )
            })}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Minimum salary">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">
                {symbol}
              </span>
              <input
                type="number"
                className="input pl-8"
                value={form.salaryMin || ''}
                onChange={(e) => update('salaryMin', e.target.value)}
                placeholder="500000"
              />
            </div>
          </Field>
          <Field label="Maximum salary">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm pointer-events-none">
                {symbol}
              </span>
              <input
                type="number"
                className="input pl-8"
                value={form.salaryMax || ''}
                onChange={(e) => update('salaryMax', e.target.value)}
                placeholder="800000"
              />
            </div>
          </Field>
        </div>

        {(form.salaryMin || form.salaryMax) && (
          <p className="text-xs text-gray-500 mt-3">
            Preview:{' '}
            <span className="font-semibold text-gray-700">
              {symbol}
              {form.salaryMin
                ? Number(form.salaryMin).toLocaleString()
                : '—'}{' '}
              – {symbol}
              {form.salaryMax
                ? Number(form.salaryMax).toLocaleString()
                : '—'}
            </span>
          </p>
        )}
      </Section>

      <Section title="Description">
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Let AI write it for you
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Uses your title, level, and skills to draft About, Responsibilities,
              and Requirements.
            </p>
          </div>
          <AIJobDescriptionWriter
            formData={{
              title: form.title,
              companyName: company?.name || '',
              location: form.location,
              jobType: form.jobType,
              workMode: form.workMode,
              experienceLevel: form.experienceLevel,
              category: form.category,
              keySkills: form.skills,
            }}
            onInsert={(text) => {
              const parsed = parseAIJobDescription(text)
              setForm((f) => ({
                ...f,
                description: parsed.description || f.description,
                responsibilities:
                  parsed.responsibilities || f.responsibilities,
                requirements: parsed.requirements || f.requirements,
              }))
            }}
          />
        </div>

        <Field label="About the role *">
          <textarea
            rows={5}
            className="input resize-none"
            value={form.description || ''}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What the job involves..."
          />
        </Field>
        <Field label="Responsibilities" className="mt-4">
          <textarea
            rows={4}
            className="input resize-none"
            value={form.responsibilities || ''}
            onChange={(e) => update('responsibilities', e.target.value)}
            placeholder="One per line..."
          />
        </Field>
        <Field label="Requirements" className="mt-4">
          <textarea
            rows={4}
            className="input resize-none"
            value={form.requirements || ''}
            onChange={(e) => update('requirements', e.target.value)}
            placeholder="One per line..."
          />
        </Field>
      </Section>

      <Section title="Required skills">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
            placeholder="e.g. React"
          />
          <button onClick={addSkill} type="button" className="btn-outline">
            <Plus size={16} /> Add
          </button>
        </div>
        {form.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {form.skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-100 px-3 py-1.5 text-sm font-medium text-brand-800"
              >
                {s}
                <button
                  onClick={() => removeSkill(s)}
                  className="text-brand-400 hover:text-brand-700"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="container-app py-3 flex items-center justify-end gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn-outline"
          >
            <Save size={16} /> Save as draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !company.verified}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed group"
            title={!company.verified ? "Verify your company to publish" : "Publish this job"}
          >
            {!company.verified ? <Lock size={16} /> : <Sparkles size={16} />}
            {saving ? 'Saving...' : 'Publish Job'}
          </button>
        </div>
      </div>
    </div>
  )
}