import { useState } from 'react'
import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'

const COLUMNS = [
  { v: 'applied', l: 'Applied', accent: 'blue' },
  { v: 'under_review', l: 'Reviewing', accent: 'yellow' },
  { v: 'shortlisted', l: 'Shortlisted', accent: 'green' },
  { v: 'interview', l: 'Interview', accent: 'purple' },
  { v: 'hired', l: 'Hired', accent: 'brand' },
  { v: 'rejected', l: 'Rejected', accent: 'red' },
]

const ACCENT_STYLES = {
  blue: {
    header: 'bg-blue-50 text-blue-700 border-blue-100',
    dot: 'bg-blue-500',
    hover: 'bg-blue-50/50 border-blue-300',
  },
  yellow: {
    header: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    dot: 'bg-yellow-500',
    hover: 'bg-yellow-50/50 border-yellow-300',
  },
  green: {
    header: 'bg-green-50 text-green-700 border-green-100',
    dot: 'bg-green-500',
    hover: 'bg-green-50/50 border-green-300',
  },
  purple: {
    header: 'bg-purple-50 text-purple-700 border-purple-100',
    dot: 'bg-purple-500',
    hover: 'bg-purple-50/50 border-purple-300',
  },
  brand: {
    header: 'bg-brand-50 text-brand-700 border-brand-100',
    dot: 'bg-brand-500',
    hover: 'bg-brand-50/50 border-brand-300',
  },
  red: {
    header: 'bg-red-50 text-red-700 border-red-100',
    dot: 'bg-red-500',
    hover: 'bg-red-50/50 border-red-300',
  },
}

export default function KanbanBoard({
  apps,
  profiles,
  onStatusChange,
  busyId,
}) {
  const [draggingId, setDraggingId] = useState(null)
  const [hoverColumn, setHoverColumn] = useState(null)

  const byStatus = (status) => apps.filter((a) => a.status === status)

  const handleDrop = async (status) => {
    setHoverColumn(null)
    if (!draggingId) return
    const app = apps.find((a) => a.id === draggingId)
    setDraggingId(null)
    if (!app || app.status === status) return
    await onStatusChange?.(app, status)
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3 hidden lg:block">
        💡 Drag a card between columns to update the candidate's status.
      </p>

      <div className="lg:overflow-x-auto -mx-4 px-4 pb-2">
        <div className="grid grid-flow-col auto-cols-[85vw] sm:auto-cols-[300px] gap-3 lg:gap-4 min-w-max lg:min-w-0">
          {COLUMNS.map((col) => {
            const items = byStatus(col.v)
            const accent = ACCENT_STYLES[col.accent]
            const isHover = hoverColumn === col.v

            return (
              <div
                key={col.v}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (hoverColumn !== col.v) setHoverColumn(col.v)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    if (hoverColumn === col.v) setHoverColumn(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(col.v)
                }}
                className={`rounded-xl border-2 transition-all min-h-[300px] flex flex-col ${
                  isHover
                    ? `${accent.hover} border-dashed`
                    : 'bg-gray-50/60 border-transparent'
                }`}
              >
                {/* Column header */}
                <div className="p-3 sticky top-0 z-10 bg-inherit rounded-t-xl">
                  <div
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${accent.header}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {col.l}
                      </span>
                    </div>
                    <span className="text-xs font-bold">{items.length}</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 px-2.5 pb-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      {isHover ? 'Drop here' : 'No candidates'}
                    </div>
                  ) : (
                    items.map((a) => (
                      <KanbanCard
                        key={a.id}
                        app={a}
                        profile={profiles[a.applicantId] || {}}
                        isDragging={draggingId === a.id}
                        onDragStart={setDraggingId}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setHoverColumn(null)
                        }}
                        onOpenStatus={onStatusChange}
                      />
                    ))
                  )}

                  {/* Drop hint when dragging over an empty column */}
                  {isHover && items.length > 0 && (
                    <div className="rounded-xl border-2 border-dashed border-current opacity-40 flex items-center justify-center py-3 text-xs font-semibold">
                      <Plus size={14} className="mr-1" /> Drop here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}