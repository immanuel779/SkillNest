import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'
import ShortcutHelpModal from '../components/ShortcutHelpModal'
import CommandPalette from '../components/CommandPalette'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export default function MainLayout() {
  const [showHelp, setShowHelp] = useState(false)
  const [showPalette, setShowPalette] = useState(false)

  const openHelp = useCallback(() => setShowHelp(true), [])
  const openPalette = useCallback(() => setShowPalette(true), [])

  useKeyboardShortcuts({ onHelp: openHelp, onCommand: openPalette })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {showHelp && <ShortcutHelpModal onClose={() => setShowHelp(false)} />}
      {showPalette && (
        <CommandPalette onClose={() => setShowPalette(false)} />
      )}
    </div>
  )
}