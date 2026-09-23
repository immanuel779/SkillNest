import { useState } from 'react'
import {
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Wand2,
  AlertCircle,
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
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function ResumeForm({ resume, setResume, profile }) {
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
        {
          id: uid(),
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          bullets: [''],
        },
      ],
    }))

  const removeExperience = (id) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.filter((x) => x.id !== id),
    }))

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
          ? {
              ...x,
              bullets: x.bullets.map((b, i) => (i === idx ? value : b)),
            }
          : x
      ),
    }))

  const removeBullet = (expId, idx) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((x) =>
        x.id === expId
          ? { ...x, bullets: x.bullets.filter((_, i) => i !== idx) }
          : x
      ),
    }))

  const updateEducation = (id, patch) =>
    setResume((r) => ({
      ...r,
      education: r.education.map((x) =>
        x.id === id ? { ...x, ...patch } : x
      ),
    }))

  const addEducation = () =>
    setResume((r) => ({
      ...r,
      education: [
        ...r.education,
        {
          id: uid(),
          school: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }))

  const removeEducation = (id) =>
    setResume((r) => ({
      ...r,
      education: r.education.filter((x) => x.id !== id),
    }))

  const updateProject = (id, patch) =>
    setResume((r) => ({
      ...r,
      projects: r.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))

  const addProject = () =>
    setResume((r) => ({
      ...r,
      projects: [
        ...r.projects,
        { id: uid(), name: '', url: '', description: '', bullets: [] },
      ],
    }))

  const removeProject = (id) =>
    setResume((r) => ({
      ...r,
      projects: r.projects.filter((x) => x.id !== id),
    }))

  const addSkill = () =>
    setResume((r) => ({
      ...r,
      skills: [
        ...r.skills,
        { id: uid(), name: '', level: 'Intermediate' },
      ],
    }))

  const updateSkill = (id, patch) =>
    setResume((r) => ({
      ...r,
      skills: r.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))

  const removeSkill = (id) =>
    setResume((r) => ({
      ...r,
      skills: r.skills.filter((s) => s.id !== id),
    }))

  /* ============================ AI ACTIONS ============================ */

  const aiPolishSummary = async () => {
    setAiBusy('summary')
    setError('')
    try {
      const text = await polishSummary({
        currentSummary: resume.summary,
        profile,
      })
      update({ summary: text })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAiBusy(null)
    }
  }

  const aiGenerateSummary = async () => {
    setAiBusy('summary')
    setError('')
    try {
      const text = await generateSummaryFromProfile({ profile })
      update({ summary: text })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAiBusy(null)
    }
  }

  const aiImproveBullet = async (expId, idx) => {
    const exp = resume.experience.find((x) => x.id === expId)
    const bullet = exp?.bullets?.[idx]
    if (!bullet?.trim()) return
    const key = `bullet-${expId}-${idx}`
    setAiBusy(key)
    setError('')
    try {
      const text = await improveBullet({
        bullet,
        role: exp.title,
        company: exp.company,
      })
      updateBullet(expId, idx, text.trim())
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAiBusy(null)
    }
  }

  const aiSuggestSkills = async () => {
    setAiBusy('skills')
    setError('')
    try {
      const expText = resume.experience
        .slice(0, 3)
        .map((x) => `${x.title} at ${x.company}`)
        .join(', ')
      const list = await suggestSkills({
        headline: resume.basics.headline,
        experience: expText,
      })
      // dedupe
      const existing = new Set(
        resume.skills.map((s) => s.name.toLowerCase().trim())
      )
      const newSkills = list
        .filter((n) => !existing.has(n.toLowerCase().trim()))
        .slice(0, 8)
        .map((name) => ({ id: uid(), name, level: 'Intermediate' }))
      update({ skills: [...resume.skills, ...newSkills] })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAiBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* BASICS */}
      <section className="card">
        <h2 className="text-lg font-bold mb-4">Basics</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name">
            <input
              className="input"
              value={resume.basics.fullName || ''}
              onChange={(e) => updateBasics('fullName', e.target.value)}
              placeholder="Your Name"
            />
          </Field>
          <Field label="Headline">
            <input
              className="input"
              value={resume.basics.headline || ''}
              onChange={(e) => updateBasics('headline', e.target.value)}
              placeholder="Senior Frontend Engineer"
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              value={resume.basics.email || ''}
              onChange={(e) => updateBasics('email', e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={resume.basics.phone || ''}
              onChange={(e) => updateBasics('phone', e.target.value)}
              placeholder="+234 803 123 4567"
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={resume.basics.location || ''}
              onChange={(e) => updateBasics('location', e.target.value)}
              placeholder="Lagos, Nigeria"
            />
          </Field>
          <Field label="Website">
            <input
              className="input"
              value={resume.basics.website || ''}
              onChange={(e) => updateBasics('website', e.target.value)}
              placeholder="https://yoursite.com"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className="input"
              value={resume.basics.linkedin || ''}
              onChange={(e) => updateBasics('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/you"
            />
          </Field>
          <Field label="GitHub">
            <input
              className="input"
              value={resume.basics.github || ''}
              onChange={(e) => updateBasics('github', e.target.value)}
              placeholder="https://github.com/you"
            />
          </Field>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-lg font-bold">Professional summary</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={aiGenerateSummary}
              disabled={aiBusy === 'summary'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
            >
              {aiBusy === 'summary' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              Generate
            </button>
            <button
              type="button"
              onClick={aiPolishSummary}
              disabled={aiBusy === 'summary' || !resume.summary?.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
            >
              {aiBusy === 'summary' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Wand2 size={12} />
              )}
              Polish
            </button>
          </div>
        </div>
        <textarea
          rows={5}
          className="input resize-none"
          value={resume.summary || ''}
          onChange={(e) => update({ summary: e.target.value })}
          placeholder="3-4 sentences about your experience and what you're looking for."
        />
      </section>

      {/* EXPERIENCE */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">Experience</h2>
          <button
            type="button"
            onClick={addExperience}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add role
          </button>
        </div>

        {resume.experience.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No experience yet.
          </p>
        )}

        <div className="space-y-4">
          {resume.experience.map((x) => (
            <div
              key={x.id}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/40"
            >
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Job title">
                  <input
                    className="input"
                    value={x.title || ''}
                    onChange={(e) =>
                      updateExperience(x.id, { title: e.target.value })
                    }
                  />
                </Field>
                <Field label="Company">
                  <input
                    className="input"
                    value={x.company || ''}
                    onChange={(e) =>
                      updateExperience(x.id, { company: e.target.value })
                    }
                  />
                </Field>
                <Field label="Location">
                  <input
                    className="input"
                    value={x.location || ''}
                    onChange={(e) =>
                      updateExperience(x.id, { location: e.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start">
                    <input
                      type="month"
                      className="input"
                      value={x.startDate || ''}
                      onChange={(e) =>
                        updateExperience(x.id, { startDate: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="End">
                    <input
                      type="month"
                      className="input"
                      value={x.endDate || ''}
                      onChange={(e) =>
                        updateExperience(x.id, { endDate: e.target.value })
                      }
                      disabled={x.isCurrent}
                    />
                  </Field>
                </div>
              </div>

              <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={!!x.isCurrent}
                  onChange={(e) =>
                    updateExperience(x.id, { isCurrent: e.target.checked })
                  }
                />
                Currently working here
              </label>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Bullets</label>
                  <button
                    type="button"
                    onClick={() => addBullet(x.id)}
                    className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus size={11} /> Add bullet
                  </button>
                </div>
                <div className="space-y-2">
                  {x.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <textarea
                        rows={1}
                        className="input flex-1 resize-none"
                        value={b}
                        onChange={(e) =>
                          updateBullet(x.id, i, e.target.value)
                        }
                        placeholder="Describe an achievement or task"
                      />
                      <button
                        type="button"
                        onClick={() => aiImproveBullet(x.id, i)}
                        disabled={!b.trim() || aiBusy === `bullet-${x.id}-${i}`}
                        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-purple-700 hover:bg-purple-50 border border-purple-200 disabled:opacity-40"
                        title="Improve with AI"
                      >
                        {aiBusy === `bullet-${x.id}-${i}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBullet(x.id, i)}
                        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => removeExperience(x.id)}
                  className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove role
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">Projects</h2>
          <button
            type="button"
            onClick={addProject}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add project
          </button>
        </div>

        {resume.projects.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No projects yet.
          </p>
        )}

        <div className="space-y-3">
          {resume.projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 grid sm:grid-cols-2 gap-3"
            >
              <Field label="Project name">
                <input
                  className="input"
                  value={p.name || ''}
                  onChange={(e) =>
                    updateProject(p.id, { name: e.target.value })
                  }
                />
              </Field>
              <Field label="URL">
                <input
                  className="input"
                  value={p.url || ''}
                  onChange={(e) =>
                    updateProject(p.id, { url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  rows={2}
                  className="input resize-none"
                  value={p.description || ''}
                  onChange={(e) =>
                    updateProject(p.id, { description: e.target.value })
                  }
                />
              </Field>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeProject(p.id)}
                  className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EDUCATION */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">Education</h2>
          <button
            type="button"
            onClick={addEducation}
            className="btn-outline !py-2 !px-3 text-sm"
          >
            <Plus size={14} /> Add education
          </button>
        </div>

        {resume.education.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No education yet.
          </p>
        )}

        <div className="space-y-3">
          {resume.education.map((x) => (
            <div
              key={x.id}
              className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 grid sm:grid-cols-2 gap-3"
            >
              <Field label="School">
                <input
                  className="input"
                  value={x.school || ''}
                  onChange={(e) =>
                    updateEducation(x.id, { school: e.target.value })
                  }
                />
              </Field>
              <Field label="Degree">
                <input
                  className="input"
                  value={x.degree || ''}
                  onChange={(e) =>
                    updateEducation(x.id, { degree: e.target.value })
                  }
                  placeholder="B.Sc."
                />
              </Field>
              <Field label="Field of study">
                <input
                  className="input"
                  value={x.field || ''}
                  onChange={(e) =>
                    updateEducation(x.id, { field: e.target.value })
                  }
                  placeholder="Computer Science"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <input
                    type="month"
                    className="input"
                    value={x.startDate || ''}
                    onChange={(e) =>
                      updateEducation(x.id, { startDate: e.target.value })
                    }
                  />
                </Field>
                <Field label="End">
                  <input
                    type="month"
                    className="input"
                    value={x.endDate || ''}
                    onChange={(e) =>
                      updateEducation(x.id, { endDate: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeEducation(x.id)}
                  className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-lg font-bold">Skills</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={aiSuggestSkills}
              disabled={aiBusy === 'skills'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
            >
              {aiBusy === 'skills' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              Suggest
            </button>
            <button
              type="button"
              onClick={addSkill}
              className="btn-outline !py-2 !px-3 text-sm"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {resume.skills.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No skills yet.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {resume.skills.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-100 pl-1 pr-2 py-1"
            >
              <input
                className="bg-transparent text-sm font-medium text-brand-800 outline-none w-24 px-2 py-0.5"
                value={s.name}
                onChange={(e) =>
                  updateSkill(s.id, { name: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => removeSkill(s.id)}
                className="w-5 h-5 rounded flex items-center justify-center text-brand-400 hover:text-brand-700 hover:bg-brand-100"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}