import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Don't interfere with hash-based anchor scrolls
    if (window.location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}