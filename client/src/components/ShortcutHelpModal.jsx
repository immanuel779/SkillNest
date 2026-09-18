import { X, Command, Keyboard } from 'lucide-react'

const SINGLE = [
  { keys: ['⌘', 'K'], label: 'Open command palette' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['?'], label: 'Show shortcuts' },
  { keys: ['Esc'], label: 'Close dialogs' },
]

const SEQUENCES = [
  { combo: ['g', 'j'], label: 'Go to Find Jobs' },
  { combo: ['g', 'c'], label: 'Go to Companies' },
  { combo: ['g', 'a'], label: 'Go to Applications' },
  { combo: ['g', 's'], label: 'Go to Saved Jobs' },
  { combo: ['g', 'i'], label: 'Go to Interviews' },
  { combo: ['g', 'm'], label: 'Go to Messages' },
  { combo: ['g', 'n'], label: 'Go to Notifications' },
  { combo: ['g', 'p'], label: 'Go to My Profile' },
  { combo: ['g', 'd'], label: 'Go to Dashboard' },
  { combo: ['g', 'h'], label: 'Go Home' },
]

function Key({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-sm">
      {children}
    </kbd>
  )
}

export default function ShortcutHelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Keyboard shortcuts</h2>
              <p className="text-xs text-gray-500">
                Move around SkillNest without lifting your hands off the keys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
              Single keys
            </h3>
            <ul className="space-y-2.5">
              {SINGLE.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-700">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <Key key={k}>{k}</Key>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
              Navigate with <Key>g</Key> then a key
            </h3>
            <ul className="space-y-2.5">
              {SEQUENCES.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-gray-700">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.combo.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-[10px] text-gray-400">then</span>
                        )}
                        <Key>{k}</Key>
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Command size={12} />
            Shortcuts are disabled while typing in a form field.
          </p>
          <button onClick={onClose} className="btn-primary !py-2 !px-4 text-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}