import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  FileText,
  MoreVertical,
  GripVertical,
} from 'lucide-react'

export default function KanbanCard({
  app,
  profile,
  onDragStart,
  onDragEnd,
  onOpenStatus,
  isDragging,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const name = profile?.fullName || 'Candidate'
  const headline = profile?.headline || '—'
  const location = profile?.location || ''
  const photoURL = profile?.photoURL
  const skills = profile?.skills || []
  const hasResume = !!(app.resumeUrl || profile?.resumeUrl)

  const daysSince = app.createdAt?.seconds
    ? Math.floor((Date.now() / 1000 - app.createdAt.seconds) / 86400)
    : null

  const timeLabel =
    daysSince === null
      ? ''
      : daysSince === 0
      ? 'Today'
      : daysSince === 1
      ? '1 day ago'
      : `${daysSince} days ago`

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', app.id)
        onDragStart?.(app.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`relative bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-brand-300 group ${
        isDragging ? 'opacity-40 scale-[0.98]' : ''
      }`}
    >
      {/* Drag handle (visual only — whole card is draggable) */}
      <GripVertical
        size={13}
        className="absolute top-2 right-2 text-gray-300 opacity-0 group-hover:opacity-100 transition"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
          {photoURL ? (
            <img src={photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <Link
            to={`/applicants/${app.applicantId}`}
            className="text-sm font-bold text-gray-900 hover:text-brand-700 hover:underline truncate block"
            onClick={(e) => e.stopPropagation()}
          >
            {name}
          </Link>
          <p className="text-[11px] text-brand-700 font-medium truncate">
            {headline}
          </p>
        </div>
      </div>

      {/* Location + resume */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
        {location && (
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={10} /> {location}
          </span>
        )}
        {hasResume && (
          <span className="inline-flex items-center gap-0.5 text-green-700">
            <FileText size={10} /> Resume
          </span>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.slice(0, 3).map((s) => {
            const label = typeof s === 'string' ? s : s.name
            return (
              <span
                key={label}
                className="text-[10px] bg-brand-50 text-brand-700 border border-brand-100 rounded px-1.5 py-0.5"
              >
                {label}
              </span>
            )
          })}
          {skills.length > 3 && (
            <span className="text-[10px] text-gray-400 px-1 py-0.5">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {timeLabel && (
          <span className="text-[10px] text-gray-400">{timeLabel}</span>
        )}

        {/* Mobile / accessibility: open status menu */}
        <div className="relative ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition"
            aria-label="Change status"
          >
            <MoreVertical size={13} />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop closes menu */}
              <div
                className="fixed inset-0 z-30"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-40">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  Move to
                </p>
                {[
                  { v: 'applied', l: 'Applied' },
                  { v: 'under_review', l: 'Under Review' },
                  { v: 'shortlisted', l: 'Shortlisted' },
                  { v: 'interview', l: 'Interview' },
                  { v: 'hired', l: 'Hired' },
                  { v: 'rejected', l: 'Rejected' },
                ]
                  .filter((s) => s.v !== app.status)
                  .map((s) => (
                    <button
                      key={s.v}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        onOpenStatus?.(app, s.v)
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition"
                    >
                      {s.l}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}