import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Globe,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  FileText,
  Download,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function ApplicantProfileView() {
  const { uid } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (alive && snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() })
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [uid])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container-app py-16 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="font-semibold text-gray-700">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="container-app py-10 max-w-4xl">
      <button
        onClick={() => history.back()}
        className="text-sm text-gray-500 hover:text-brand-700 inline-flex items-center gap-1 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="card relative overflow-hidden mb-6">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center overflow-hidden shadow-lg shadow-brand-500/30 shrink-0">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl font-bold">
                {profile.fullName?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {profile.fullName || 'Candidate'}
            </h1>
            {profile.headline && (
              <p className="text-brand-700 font-semibold mt-1">
                {profile.headline}
              </p>
            )}
            {profile.location && (
              <p className="mt-2 text-sm text-gray-500 inline-flex items-center gap-1.5">
                <MapPin size={14} /> {profile.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {profile.about && (
            <div className="card">
              <h2 className="text-lg font-bold mb-3">About</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {profile.about}
              </p>
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => {
                  const label = typeof s === 'string' ? s : s.name
                  const level = typeof s === 'object' ? s.level : null
                  return (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 text-sm bg-brand-50 text-brand-700 border border-brand-100 rounded-lg px-3 py-1.5 font-medium"
                    >
                      {label}
                      {level && (
                        <span className="text-[10px] text-brand-500">
                          · {level}
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {profile.experience?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-brand-600" />
                Work Experience
              </h2>
              <div className="space-y-4">
                {profile.experience.map((x) => (
                  <div
                    key={x.id}
                    className="border-l-2 border-brand-200 pl-4 py-1"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900">{x.title}</h3>
                        <p className="text-sm text-gray-600">
                          {x.company}
                          {x.location && ` · ${x.location}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1 shrink-0">
                        <Calendar size={11} />
                        {x.startDate}
                        {x.isCurrent
                          ? ' — Present'
                          : x.endDate
                          ? ` — ${x.endDate}`
                          : ''}
                      </span>
                    </div>
                    {x.description && (
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                        {x.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.education?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-brand-600" />
                Education
              </h2>
              <div className="space-y-4">
                {profile.education.map((x) => (
                  <div
                    key={x.id}
                    className="border-l-2 border-brand-200 pl-4 py-1"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900">{x.school}</h3>
                        <p className="text-sm text-gray-600">
                          {[x.degree, x.field].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {x.startDate}
                        {x.endDate ? ` — ${x.endDate}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {profile.resumeUrl && (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="card card-hover block text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-green-50 flex items-center justify-center mb-2">
                <FileText size={20} className="text-green-700" />
              </div>
              <p className="font-bold text-sm">Resume</p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {profile.resumeName || 'View file'}
              </p>
              <span className="text-xs text-brand-700 font-semibold mt-3 inline-flex items-center gap-1">
                <Download size={12} /> Open
              </span>
            </a>
          )}

          <div className="card">
            <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                >
                  <Mail size={14} className="mt-0.5 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </a>
              )}
              {profile.phone && (
                <span className="flex items-start gap-2 text-gray-700">
                  <Phone size={14} className="mt-0.5 shrink-0" />
                  <span>{profile.phone}</span>
                </span>
              )}
              {profile.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                >
                  <Globe size={14} className="mt-0.5 shrink-0" />
                  <span className="truncate">Portfolio</span>
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                >
                  <LinkIcon size={14} className="mt-0.5 shrink-0" />
                  <span>LinkedIn</span>
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 text-gray-700 hover:text-brand-700"
                >
                  <LinkIcon size={14} className="mt-0.5 shrink-0" />
                  <span>GitHub</span>
                </a>
              )}
            </div>
          </div>

          {(profile.expectedSalary ||
            profile.preferredJobType ||
            profile.preferredWorkMode) && (
            <div className="card">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
                Preferences
              </h3>
              <dl className="space-y-2 text-sm">
                {profile.expectedSalary && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Expected salary</dt>
                    <dd className="font-medium text-gray-800">
                      ${profile.expectedSalary.toLocaleString()}
                    </dd>
                  </div>
                )}
                {profile.preferredJobType && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Job type</dt>
                    <dd className="font-medium text-gray-800 capitalize">
                      {profile.preferredJobType.replace('_', ' ')}
                    </dd>
                  </div>
                )}
                {profile.preferredWorkMode && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500">Work mode</dt>
                    <dd className="font-medium text-gray-800 capitalize">
                      {profile.preferredWorkMode}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}