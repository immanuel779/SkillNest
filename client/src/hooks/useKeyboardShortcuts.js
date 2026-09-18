import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Global keyboard shortcuts.
 * Ignores keystrokes when the user is typing in an input/textarea/select.
 *
 *   Sequences: g + j → /jobs, g + m → /messages, etc.
 *   Single:    / → focus [data-search-input], ? → open cheat sheet
 *
 * Provide an `onHelp` callback to open the cheat sheet.
 */
export function useKeyboardShortcuts({ onHelp } = {}) {
  const navigate = useNavigate()
  const sequenceRef = useRef({ key: null, at: 0 })

  useEffect(() => {
    const SEQUENCE_TIMEOUT_MS = 900

    const SEQUENCES = {
      'g j': () => navigate('/jobs'),
      'g h': () => navigate('/'),
      'g m': () => navigate('/messages'),
      'g a': () => navigate('/applications'),
      'g s': () => navigate('/saved-jobs'),
      'g i': () => navigate('/interviews'),
      'g n': () => navigate('/notifications'),
      'g p': () => navigate('/profile/job-seeker'),
      'g c': () => navigate('/companies'),
      'g d': () => navigate('/dashboard/job-seeker'),
    }

    const isTypingTarget = (el) => {
      if (!el) return false
      const tag = el.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
      if (el.isContentEditable) return true
      return false
    }

    const focusSearch = () => {
      const input = document.querySelector('[data-search-input]')
      if (input) {
        input.focus()
        if (typeof input.select === 'function') input.select()
      }
    }

    const onKey = (e) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return

      const key = e.key

      // Single-key shortcuts
      if (key === '/') {
        e.preventDefault()
        focusSearch()
        return
      }
      if (key === '?') {
        e.preventDefault()
        onHelp?.()
        return
      }

      // Sequence handling
      const now = Date.now()
      const prev = sequenceRef.current

      if (prev.key && now - prev.at < SEQUENCE_TIMEOUT_MS) {
        const combo = `${prev.key} ${key.toLowerCase()}`
        const action = SEQUENCES[combo]
        sequenceRef.current = { key: null, at: 0 }
        if (action) {
          e.preventDefault()
          action()
          return
        }
      }

      // Start a new sequence
      if (key.toLowerCase() === 'g') {
        sequenceRef.current = { key: 'g', at: now }
      } else {
        sequenceRef.current = { key: null, at: 0 }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigate, onHelp])
}