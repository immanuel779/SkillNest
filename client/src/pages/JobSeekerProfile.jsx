import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Save,
  Plus,
  Trash2,
  MapPin,
  Briefcase,
  GraduationCap,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../services/profileService'
import { uploadImage, uploadDocument } from '../services/storageService'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary']
const WORK_MODES = ['onsite', 'remote', 'hybrid']

const uid = () => Math.random().toString(36).slice(2, 10)

export default function JobSeekerProfile() {
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    headline: '',
    about: '',
    location: '',
    phone: '',
    photoURL: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    expectedSalary: '',
    preferredJobType: '',
    preferredWorkMode: '',
    skills: [],
    experience: [],
    education: [],
    resumeUrl: '',
    resumeName: '',
  })

  const photoInput = useRef(null)
  const resumeInput = useRef(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const data = await getProfile(user.uid)
        if (alive && data) {
          setForm((f) => ({ ...f, ...data }))
        }
      } catch (err) {
        setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName,
        headline: form.headline,
        about: form.about,
        location: form.location,
        phone: form.phone,
        photoURL: form.photoURL,
        portfolioUrl: form.portfolioUrl,
        linkedinUrl: form.linkedinUrl,
        githubUrl: form.githubUrl,
        expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : null,
        preferredJobType: form.preferredJobType,
        preferredWorkMode: form.preferredWorkMode,
        skills: form.skills,
        experience: form.experience,
        education: form.education,
        resumeUrl: form.resumeUrl,
        resumeName: form.resumeName,
      }
      await updateProfile(user.uid, payload)
      await refreshProfile()
      flashSaved()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(`avatars/${user.uid}`, file)
      update('photoURL', url)
      await updateProfile(user.uid, { photoURL: url })
      await refreshProfile()
      flashSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (photoInput.current) photoInput.current.value = ''
    }
  }

  const onResume = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadDocument(`resumes/${user.uid}`, file)
      update('resumeUrl', url)
      update('resumeName', file.name)
      await updateProfile(user.uid, { resumeUrl: url, resumeName: file.name })
      await refreshProfile()
      flashSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (resumeInput.current) resumeInput.current.value = ''
    }
  }

  const addSkill = () => {
    const name = prompt('Skill name?')?.trim()
    if (!name) return
    if (form.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return
    update('skills', [...form.skills, { name, level: 'Intermediate' }])
  }
  const removeSkill = (name) =>
    update('skills', form.skills.filter((s) => s.name !== name))
  const setSkillLevel = (name, level) =>
    update('skills', form.skills.map((s) => (s.name === name ? { ...s, level } : s)))

  const addExperience = () =>
    update('experience', [
      ...form.experience,
      {
        id: uid(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      },
    ])
  const updateExperience = (id, key, value) =>
    update(
      'experience',
      form.experience.map((x) => (x.id === id ? { ...x, [key]: value } : x))
    )
  const removeExperience = (id) =>
    update('experience', form.experience.filter((x) => x.id !== id))

  const addEducation = () =>
    update('education', [
      ...form.education,
      {
        id: uid(),
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ])
  const updateEducation = (id, key, value) =>
    update(
      'education',
      form.education.map((x) => (x.id === id ? { ...x, [key]: value } : x))
    )
  const removeEducation = (id) =>
    update('education', form.education.filter((x) => x.id !== id))

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-10 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">My Profile</h1>
        <p className="text-gray-500 mt-1">
          This is what employers will see when you apply.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center overflow-hidden shadow-lg shadow-brand-500/30">
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {form.fullName?.[0]?.toUpperCase() || '?'}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition"
              aria-label="Change photo"
            >
              <Camera size={14} className="text-gray-600" />
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              onChange={onPhoto}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <input
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Your full name"
              className="text-2xl font-extrabold bg-transparent outline-none w-full border-b border-transparent focus:border-brand-300 transition-colors"
            />
            <input
              value={form.headline}
              onChange={(e) => update('headline', e.target.value)}
              placeholder="Professional headline (e.g. Senior Frontend Engineer)"
              className="mt-2 text-brand-700 font-semibold bg-transparent outline-none w-full border-b border-transparent focus:border-brand-300 transition-colors"
            />
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={14} />
              <input
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Location (City, Country)"
                className="bg-transparent outline-none flex-1 border-b border-transparent focus:border-brand-300 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* About + Contact */}
      <Section title="About" subtitle="Tell employers who you are.">
        <textarea
          value={form.about}
          onChange={(e) => update('about', e.target.value)}
          rows={5}
          placeholder="A short bio about your experience, focus, and what you're looking for..."
          className="input resize-none"
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Phone / WhatsApp">
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+234 803 123 4567"
                className="input pl-10"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Employers can contact you on WhatsApp with this number.
            </p>
          </Field>
          <Field label="Portfolio URL">
            <input
              value={form.portfolioUrl}
              onChange={(e) => update('portfolioUrl', e.target.value)}
              placeholder="https://yourportfolio.com"
              className="input"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              value={form.linkedinUrl}
              onChange={(e) => update('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/you"
              className="input"
            />
          </Field>
          <Field label="GitHub">
            <input
              value={form.githubUrl}
              onChange={(e) => update('githubUrl', e.target.value)}
              placeholder="https://github.com/you"
              className="input"
            />
          </Field>
        </div>
      </Section>

      {/* Skills */}
      <Section
        title="Skills"
        subtitle="Add the skills employers should find you by."
        action={
          <button
            type="button"
            onClick={addSkill}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add skill
          </button>
        }
      >
        {form.skills.length === 0 ? (
          <EmptyState icon={Briefcase} text="No skills yet. Add your first skill." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <div
                key={s.name}
                className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg bg-brand-50 border border-brand-100"
              >
                <span className="text-sm font-medium text-brand-800">{s.name}</span>
                <select
                  value={s.level}
                  onChange={(e) => setSkillLevel(s.name, e.target.value)}
                  className="text-xs bg-transparent text-brand-600 outline-none cursor-pointer"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeSkill(s.name)}
                  className="w-5 h-5 rounded flex items-center justify-center text-brand-400 hover:bg-brand-100 hover:text-brand-700 transition"
                  aria-label="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Experience */}
      <Section
        title="Work Experience"
        subtitle="Your professional history."
        action={
          <button
            type="button"
            onClick={addExperience}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add
          </button>
        }
      >
        {form.experience.length === 0 ? (
          <EmptyState icon={Briefcase} text="No experience added yet." />
        ) : (
          <div className="space-y-4">
            {form.experience.map((x) => (
              <div key={x.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Job title">
                    <input
                      value={x.title}
                      onChange={(e) => updateExperience(x.id, 'title', e.target.value)}
                      className="input"
                      placeholder="Frontend Engineer"
                    />
                  </Field>
                  <Field label="Company">
                    <input
                      value={x.company}
                      onChange={(e) => updateExperience(x.id, 'company', e.target.value)}
                      className="input"
                      placeholder="Acme Inc."
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      value={x.location}
                      onChange={(e) => updateExperience(x.id, 'location', e.target.value)}
                      className="input"
                      placeholder="Remote"
                    />
                  </Field>
                  <Field label="Start date">
                    <input
                      type="month"
                      value={x.startDate}
                      onChange={(e) => updateExperience(x.id, 'startDate', e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="End date">
                    <input
                      type="month"
                      value={x.endDate}
                      onChange={(e) => updateExperience(x.id, 'endDate', e.target.value)}
                      className="input"
                      disabled={x.isCurrent}
                    />
                  </Field>
                  <label className="flex items-center gap-2 mt-6 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={x.isCurrent}
                      onChange={(e) => updateExperience(x.id, 'isCurrent', e.target.checked)}
                    />
                    Currently working here
                  </label>
                </div>
                <Field label="Description" className="mt-3">
                  <textarea
                    rows={3}
                    value={x.description}
                    onChange={(e) => updateExperience(x.id, 'description', e.target.value)}
                    className="input resize-none"
                    placeholder="What did you work on?"
                  />
                </Field>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => removeExperience(x.id)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Education */}
      <Section
        title="Education"
        subtitle="Your academic background."
        action={
          <button
            type="button"
            onClick={addEducation}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add
          </button>
        }
      >
        {form.education.length === 0 ? (
          <EmptyState icon={GraduationCap} text="No education added yet." />
        ) : (
          <div className="space-y-4">
            {form.education.map((x) => (
              <div key={x.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="School">
                    <input
                      value={x.school}
                      onChange={(e) => updateEducation(x.id, 'school', e.target.value)}
                      className="input"
                      placeholder="University of Lagos"
                    />
                  </Field>
                  <Field label="Degree">
                    <input
                      value={x.degree}
                      onChange={(e) => updateEducation(x.id, 'degree', e.target.value)}
                      className="input"
                      placeholder="B.Sc."
                    />
                  </Field>
                  <Field label="Field of study">
                    <input
                      value={x.field}
                      onChange={(e) => updateEducation(x.id, 'field', e.target.value)}
                      className="input"
                      placeholder="Computer Science"
                    />
                  </Field>
                  <Field label="Start year">
                    <input
                      type="month"
                      value={x.startDate}
                      onChange={(e) => updateEducation(x.id, 'startDate', e.target.value)}
                      className="input"
                    />
                  </Field>
                  <Field label="End year">
                    <input
                      type="month"
                      value={x.endDate}
                      onChange={(e) => updateEducation(x.id, 'endDate', e.target.value)}
                      className="input"
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => removeEducation(x.id)}
                    className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Preferences */}
      <Section title="Job Preferences" subtitle="What kind of role are you looking for?">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Expected salary (USD / year)">
            <input
              type="number"
              value={form.expectedSalary}
              onChange={(e) => update('expectedSalary', e.target.value)}
              className="input"
              placeholder="80000"
            />
          </Field>
          <Field label="Preferred job type">
            <select
              value={form.preferredJobType}
              onChange={(e) => update('preferredJobType', e.target.value)}
              className="input"
            >
              <option value="">Any</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred work mode">
            <select
              value={form.preferredWorkMode}
              onChange={(e) => update('preferredWorkMode', e.target.value)}
              className="input"
            >
              <option value="">Any</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Resume */}
      <Section title="Resume / CV" subtitle="Upload a PDF, DOC, or DOCX (max 10MB).">
        {form.resumeUrl ? (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/50 p-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {form.resumeName || 'Resume'}
                </p>
                <a
                  href={form.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-700 hover:underline"
                >
                  View file
                </a>
              </div>
            </div>
            <button
              onClick={() => resumeInput.current?.click()}
              disabled={uploading}
              className="btn-outline !py-2 !px-3 text-sm shrink-0"
            >
              {uploading ? 'Uploading...' : 'Replace'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => resumeInput.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/40 transition p-8 text-center disabled:opacity-60"
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={20} className="text-brand-700" />
              )}
            </div>
            <p className="font-semibold text-gray-800">
              {uploading ? 'Uploading...' : 'Click to upload your resume'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX — max 10MB</p>
          </button>
        )}
        <input
          ref={resumeInput}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onResume}
          className="hidden"
        />
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="container-app py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            {saved && (
              <>
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <span className="text-green-700 font-medium">Saved</span>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="btn-primary"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, subtitle, action, children }) {
  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
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

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <Icon size={28} className="mx-auto mb-2 opacity-60" />
      <p className="text-sm">{text}</p>
    </div>
  )
}