import { useState } from 'react'
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Crown,
  Eye,
  EyeOff,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  CheckCircle2,
  Camera, // 👈 Fixed (Instagram)
  Globe,  // 👈 Fixed (Facebook)
  Video,  // 👈 Fixed (TikTok)
} from 'lucide-react'
import {
  polishSummary,
  improveBullet,
  generateSummaryFromProfile,
  suggestSkills,
} from '../../services/aiService'
import { friendlyError } from '../../utils/errors'

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10)

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card !p-0 overflow-hidden border border-gray-200 shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 bg-white hover:bg-gray-50 flex items-center justify-between transition"
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <Icon size={16} />
            </div>
          )}
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="p-5 space-y-4 border-t border-gray-100 bg-gray-50/30">
          {children}
        </div>
      )}
    </div>
  )
}

const COLORS = [
  '#6d28d9', '#0f766e', '#be123c', '#1d4ed8', '#c2410c', '#334155', '#000000',
]

const TEMPLATES = [
  { id: 'modern', name: 'Modern', isPro: false },
  { id: 'classic', name: 'Classic', isPro: false },
  { id: 'minimal', name: 'Minimal', isPro: false },
  { id: 'executive', name: 'Executive', isPro: true },
  { id: 'creative', name: 'Creative', isPro: true },
]

const SECTION_ICONS = {
  summary: FileText,
  experience: Briefcase,
  projects: Code,
  education: GraduationCap,
  skills: Sparkles,
}

const isTechRole = (headline = '') => {
  const techKeywords = ['developer', 'engineer', 'software', 'frontend', 'backend', 'fullstack', 'devops', 'data', 'it ', 'programmer', 'coder', 'react', 'node', 'web']
  return techKeywords.some(kw => headline.toLowerCase().includes(kw))
}

export default function ResumeForm({
  resume,
  setResume,
  profile,
  isPremium = false,
  onUpgradeClick,
}) {
  const [aiBusy, setAiBusy] = useState(null)
  const [error, setError] = useState('')

  const update = (patch) => setResume((r) => ({ ...r, ...patch }))
  const updateBasics = (k, v) =>
    setResume((r) => ({ ...r, basics: { ...r.basics, [k]: v } }))

  const updateExperience = (id, patch) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      ),
    }))

  const addExperience = () =>
    setResume((r) => ({
      ...r,
      experience: [
        ...r.experience,
        { id: uid(), title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [''] },
      ],
    }))

  const removeExperience = (id) =>
    setResume((r) => ({ ...r, experience: r.experience.filter((x) => x.id !== id) }))

  const addBullet = (expId) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((x) =>
        x.id === expId ? { ...x, bullets: [...x.bullets, ''] } : x
      ),
    }))

  const updateBullet = (expId, idx, value) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((x) =>
        x.id === expId
          ? { ...x, bullets: x.bullets.map((b, i) => (i === idx ? value : b)) }
          : x
      ),
    }))

  const removeBullet = (expId, idx) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((x) =>
        x.id === expId ? { ...x, bullets: x.bullets.filter((_, i) => i !== idx) } : x
      ),
    }))

  const updateEducation = (id, patch) =>
    setResume((r) => ({
      ...r,
      education: r.education.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))

  const addEducation = () =>
    setResume((r) => ({
      ...r,
      education: [...r.education, { id: uid(), school: '', degree: '', field: '', startDate: '', endDate: '' }],
    }))

  const removeEducation = (id) =>
    setResume((r) => ({ ...r, education: r.education.filter((x) => x.id !== id) }))

  const updateProject = (id, patch) =>
    setResume((r) => ({
      ...r,
      projects: r.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))

  const addProject = () =>
    setResume((r) => ({
      ...r,
      projects: [...r.projects, { id: uid(), name: '', url: '', description: '' }],
    }))

  const removeProject = (id) =>
    setResume((r) => ({ ...r, projects: r.projects.filter((x) => x.id !== id) }))

  const addSkill = () =>
    setResume((r) => ({
      ...r,
      skills: [...r.skills, { id: uid(), name: '', level: 'Intermediate' }],
    }))

  const updateSkill = (id, patch) =>
    setResume((r) => ({
      ...r,
      skills: r.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))

  const removeSkill = (id) =>
    setResume((r) => ({ ...r, skills: r.skills.filter((s) => s.id !== id) }))

  const moveSection = (index, direction) => {
    const newOrder = [...(resume.sectionOrder || [])]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    update({ sectionOrder: newOrder })
  }

  const toggleSectionVisibility = (key) => {
    const current = resume.hiddenSections || []
    const isHidden = current.includes(key)
    const newHidden = isHidden ? current.filter((k) => k !== key) : [...current, key]
    update({ hiddenSections: newHidden })
  }

  const isSectionHidden = (key) => (resume.hiddenSections || []).includes(key)

  const aiPolishSummary = async () => {
    setAiBusy('summary'); setError('')
    try {
      const text = await polishSummary({ currentSummary: resume.summary, profile })
      update({ summary: text })
    } catch (err) { setError(friendlyError(err)) } finally { setAiBusy(null) }
  }

  const aiGenerateSummary = async () => {
    setAiBusy('summary'); setError('')
    try {
      const text = await generateSummaryFromProfile({ resume })
      update({ summary: text })
    } catch (err) { setError(friendlyError(err)) } finally { setAiBusy(null) }
  }

  const aiImproveBullet = async (expId, idx) => {
    const exp = resume.experience.find((x) => x.id === expId)
    const bullet = exp?.bullets?.[idx]
    if (!bullet?.trim()) return
    const key = `bullet-${expId}-${idx}`
    setAiBusy(key); setError('')
    try {
      const text = await improveBullet({ bullet, role: exp.title, company: exp.company })
      updateBullet(expId, idx, text.trim())
    } catch (err) { setError(friendlyError(err)) } finally { setAiBusy(null) }
  }

  const aiSuggestSkills = async () => {
    setAiBusy('skills'); setError('')
    try {
      const expText = resume.experience.slice(0, 3).map((x) => `${x.title} at ${x.company}`).join(', ')
      const list = await suggestSkills({ headline: resume.basics.headline, experience: expText })
      const existing = new Set(resume.skills.map((s) => s.name.toLowerCase().trim()))
      const newSkills = list.filter((n) => !existing.has(n.toLowerCase().trim())).slice(0, 8).map((name) => ({ id: uid(), name, level: 'Intermediate' }))
      update({ skills: [...resume.skills, ...newSkills] })
    } catch (err) { setError(friendlyError(err)) } finally { setAiBusy(null) }
  }

  const showGithub = isTechRole(resume.basics?.headline) || !!resume.basics?.github

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* --- DESIGN & LAYOUT CONTROLS --- */}
      <div className="card bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wand2 size={18} className="text-brand-600" />
            Design & Layout
          </h2>
          {!isPremium && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-wider">
              Basic Plan
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="label mb-2">Template</label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => {
                const locked = t.isPro && !isPremium
                const active = resume.template === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (locked) { onUpgradeClick?.() } else { update({ template: t.id }) }
                    }}
                    className={`relative py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition flex flex-col items-center justify-center gap-1 ${
                      active ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : locked ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-white'
                    }`}
                  >
                    {t.name}
                    {locked && (
                      <span className="absolute -top-2 -right-2 bg-gray-900 text-yellow-400 rounded-full p-1 shadow-sm">
                        <Lock size={10} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {!isPremium && (
              <p className="text-[11px] text-brand-600 mt-2 flex items-center gap-1 font-medium cursor-pointer hover:underline" onClick={onUpgradeClick}>
                <Crown size={12} className="text-yellow-500" /> Unlock Executive & Creative templates
              </p>
            )}
          </div>

          <div>
            <label className="label mb-2">Font</label>
            <div className="grid grid-cols-3 gap-2">
              {['sans-serif', 'serif', 'mono'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ fontFamily: f })}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition ${
                    resume.fontFamily === f ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}
                  style={{ fontFamily: f === 'serif' ? 'Georgia, serif' : f === 'mono' ? 'Courier New, monospace' : 'inherit' }}
                >
                  {f === 'sans-serif' ? 'Sans' : f === 'serif' ? 'Serif' : 'Mono'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-b border-gray-100 pb-5">
          <label className="label mb-2">Accent Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update({ accentColor: c })}
                className={`w-8 h-8 rounded-full border-2 transition flex items-center justify-center ${
                  resume.accentColor === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              >
                {resume.accentColor === c && <CheckCircle2 size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label className="label mb-2">Reorder & Visibility</label>
          <div className="flex flex-col gap-2">
            {(resume.sectionOrder || []).map((key, i) => {
              const Icon = SECTION_ICONS[key] || FileText
              const hidden = isSectionHidden(key)
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm transition ${hidden ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700 capitalize">{key}</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <button
                      onClick={() => toggleSectionVisibility(key)}
                      className={`p-1.5 rounded-md hover:bg-gray-100 transition ${hidden ? 'text-gray-400' : 'text-brand-600'}`}
                      title={hidden ? 'Show section' : 'Hide section'}
                    >
                      {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 text-gray-500 transition"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSection(i, 1)}
                      disabled={i === resume.sectionOrder.length - 1}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 text-gray-500 transition"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* --- FORM SECTIONS --- */}
      
      <Accordion title="Personal Details" icon={User} defaultOpen={true}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name">
            <input className="input" value={resume.basics?.fullName || ''} onChange={(e) => updateBasics('fullName', e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Headline">
            <input className="input" value={resume.basics?.headline || ''} onChange={(e) => updateBasics('headline', e.target.value)} placeholder="Senior Product Designer" />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={resume.basics?.email || ''} onChange={(e) => updateBasics('email', e.target.value)} placeholder="john@example.com" />
          </Field>
          <Field label="Phone">
            <input type="tel" className="input" value={resume.basics?.phone || ''} onChange={(e) => updateBasics('phone', e.target.value)} placeholder="+234 800 000 0000" />
          </Field>
          <Field label="Location">
            <input className="input" value={resume.basics?.location || ''} onChange={(e) => updateBasics('location', e.target.value)} placeholder="Lagos, Nigeria" />
          </Field>
          <Field label="Website">
            <input className="input" value={resume.basics?.website || ''} onChange={(e) => updateBasics('website', e.target.value)} placeholder="https://johndoe.com" />
          </Field>
          <Field label="LinkedIn">
            <input className="input" value={resume.basics?.linkedin || ''} onChange={(e) => updateBasics('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" />
          </Field>
          
          {showGithub && (
            <Field label="GitHub">
              <input className="input" value={resume.basics?.github || ''} onChange={(e) => updateBasics('github', e.target.value)} placeholder="github.com/johndoe" />
            </Field>
          )}

          {/* 👇 NEW SOCIAL MEDIA FIELDS */}
          <Field label="Instagram">
            <div className="relative">
              <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={resume.basics?.instagram || ''} onChange={(e) => updateBasics('instagram', e.target.value)} placeholder="instagram.com/johndoe" />
            </div>
          </Field>
          <Field label="TikTok">
            <div className="relative">
              <Video size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={resume.basics?.tiktok || ''} onChange={(e) => updateBasics('tiktok', e.target.value)} placeholder="tiktok.com/@johndoe" />
            </div>
          </Field>
          <Field label="Facebook">
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9" value={resume.basics?.facebook || ''} onChange={(e) => updateBasics('facebook', e.target.value)} placeholder="facebook.com/johndoe" />
            </div>
          </Field>
        </div>
      </Accordion>

      <Accordion title="Professional Summary" icon={FileText}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-xs text-gray-500">3-4 sentences highlighting your top achievements and skills.</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={aiGenerateSummary} disabled={aiBusy === 'summary'} className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition">
              {aiBusy === 'summary' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Generate
            </button>
            <button type="button" onClick={aiPolishSummary} disabled={aiBusy === 'summary' || !resume.summary} className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition disabled:opacity-50">
              <Wand2 size={12} /> Polish
            </button>
          </div>
        </div>
        <textarea rows={5} className="input resize-none" value={resume.summary || ''} onChange={(e) => update({ summary: e.target.value })} placeholder="Results-driven professional with 5+ years of experience..." />
      </Accordion>

      <Accordion title="Work Experience" icon={Briefcase}>
        <button type="button" onClick={addExperience} className="btn-outline w-full mb-4 border-dashed border-2 hover:border-brand-400 hover:bg-brand-50 text-brand-700">
          <Plus size={16} /> Add Work Experience
        </button>

        <div className="space-y-4">
          {resume.experience.map((x) => (
            <div key={x.id} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm relative group">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Job Title">
                  <input className="input font-semibold" value={x.title || ''} onChange={(e) => updateExperience(x.id, { title: e.target.value })} placeholder="e.g. Frontend Engineer" />
                </Field>
                <Field label="Company">
                  <input className="input" value={x.company || ''} onChange={(e) => updateExperience(x.id, { company: e.target.value })} placeholder="e.g. Google" />
                </Field>
                <Field label="Location">
                  <input className="input" value={x.location || ''} onChange={(e) => updateExperience(x.id, { location: e.target.value })} placeholder="e.g. Remote / Lagos" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start Date">
                    <input type="month" className="input" value={x.startDate || ''} onChange={(e) => updateExperience(x.id, { startDate: e.target.value })} />
                  </Field>
                  <Field label="End Date">
                    <input type="month" className="input" value={x.endDate || ''} onChange={(e) => updateExperience(x.id, { endDate: e.target.value })} disabled={x.isCurrent} />
                  </Field>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 font-medium cursor-pointer">
                <input type="checkbox" checked={!!x.isCurrent} onChange={(e) => updateExperience(x.id, { isCurrent: e.target.checked })} className="w-4 h-4 accent-brand-600" /> I currently work here
              </label>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Achievements / Bullets</label>
                  <button type="button" onClick={() => addBullet(x.id)} className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Bullet
                  </button>
                </div>
                <div className="space-y-2">
                  {x.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      <textarea rows={1} className="input flex-1 resize-none text-sm" value={b} onChange={(e) => updateBullet(x.id, i, e.target.value)} placeholder="e.g. Increased sales by 20% in 3 months" />
                      <button type="button" onClick={() => aiImproveBullet(x.id, i)} disabled={!b.trim() || aiBusy === `bullet-${x.id}-${i}`} className="w-8 h-8 mt-0.5 rounded-md flex items-center justify-center text-purple-700 bg-purple-50 border border-purple-200 disabled:opacity-40 hover:bg-purple-100 transition" title="Improve with AI">
                        {aiBusy === `bullet-${x.id}-${i}` ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      </button>
                      <button type="button" onClick={() => removeBullet(x.id, i)} className="w-8 h-8 mt-0.5 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                <button type="button" onClick={() => removeExperience(x.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={13} /> Remove Role
                </button>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Education" icon={GraduationCap}>
        <button type="button" onClick={addEducation} className="btn-outline w-full mb-4 border-dashed border-2 hover:border-brand-400 hover:bg-brand-50 text-brand-700">
          <Plus size={16} /> Add Education
        </button>

        <div className="space-y-4">
          {resume.education.map((x) => (
            <div key={x.id} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm relative">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="School / University">
                  <input className="input font-semibold" value={x.school || ''} onChange={(e) => updateEducation(x.id, { school: e.target.value })} placeholder="e.g. University of Lagos" />
                </Field>
                <Field label="Degree">
                  <input className="input" value={x.degree || ''} onChange={(e) => updateEducation(x.id, { degree: e.target.value })} placeholder="e.g. B.Sc." />
                </Field>
                <Field label="Field of Study">
                  <input className="input" value={x.field || ''} onChange={(e) => updateEducation(x.id, { field: e.target.value })} placeholder="e.g. Computer Science" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start Year">
                    <input type="month" className="input" value={x.startDate || ''} onChange={(e) => updateEducation(x.id, { startDate: e.target.value })} />
                  </Field>
                  <Field label="End Year">
                    <input type="month" className="input" value={x.endDate || ''} onChange={(e) => updateEducation(x.id, { endDate: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => removeEducation(x.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Projects" icon={Code}>
        <button type="button" onClick={addProject} className="btn-outline w-full mb-4 border-dashed border-2 hover:border-brand-400 hover:bg-brand-50 text-brand-700">
          <Plus size={16} /> Add Project
        </button>

        <div className="space-y-4">
          {resume.projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm relative">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Project Name">
                  <input className="input font-semibold" value={p.name || ''} onChange={(e) => updateProject(p.id, { name: e.target.value })} placeholder="e.g. E-commerce Platform" />
                </Field>
                <Field label="URL (Optional)">
                  <input className="input" value={p.url || ''} onChange={(e) => updateProject(p.id, { url: e.target.value })} placeholder="https://github.com/..." />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea rows={2} className="input resize-none text-sm" value={p.description || ''} onChange={(e) => updateProject(p.id, { description: e.target.value })} placeholder="Briefly describe what the project does..." />
                </Field>
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => removeProject(p.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Skills" icon={Sparkles}>
        <div className="flex justify-end mb-3 gap-2">
          <button type="button" onClick={aiSuggestSkills} disabled={aiBusy === 'skills'} className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition">
            {aiBusy === 'skills' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Suggest
          </button>
          <button type="button" onClick={addSkill} className="btn-outline !py-1.5 !px-3 text-sm border-gray-300">
            <Plus size={14} /> Add Skill
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {resume.skills.map((s) => (
            <div key={s.id} className="inline-flex items-center gap-1 rounded-lg bg-white border border-gray-200 pl-1 pr-1.5 py-1 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 transition">
              <input className="bg-transparent text-sm font-medium text-gray-800 outline-none w-24 px-2 py-0.5" value={s.name} onChange={(e) => updateSkill(s.id, { name: e.target.value })} placeholder="Skill name" />
              <button type="button" onClick={() => removeSkill(s.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {resume.skills.length === 0 && (
            <p className="text-sm text-gray-400 italic">No skills added yet.</p>
          )}
        </div>
      </Accordion>
    </div>
  )
}