import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  Save,
  Download,
  Loader2,
  FileText,
  Eye,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getMyResume,
  saveMyResume,
  emptyResume,
} from '../services/resumeService'
import { getProfile } from '../services/profileService'
import { friendlyError } from '../utils/errors'
import ResumeForm from '../components/resume/ResumeForm'
import ResumePreview from '../components/resume/ResumePreview'

const A4_WIDTH_PX = 794 // 210mm at 96dpi

/** Auto-scales its children to fit the parent's width. */
function ScaleToFit({ baseWidth, children }) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const update = () => {
      const available = el.clientWidth
      setScale(Math.min(1, available / baseWidth))
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [baseWidth])

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <div
        style={{
          width: baseWidth * scale,
          height: 'auto',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: baseWidth,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ResumeBuilder() {
  const { user, profile: authProfile } = useAuth()
  const toast = useToast()
  const [resume, setResume] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('edit') // 'edit' | 'preview'

  const printRef = useRef(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: resume?.basics?.fullName
      ? `${resume.basics.fullName} – Resume`
      : 'Resume',
  })

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!user) return
      try {
        const [existing, profileDoc] = await Promise.all([
          getMyResume(user.uid),
          getProfile(user.uid),
        ])
        if (!alive) return
        setProfile(profileDoc || authProfile)
        setResume(existing || emptyResume(profileDoc || authProfile))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user, authProfile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await saveMyResume(user.uid, resume)
      toast.success('Resume saved', 'You can come back and edit anytime.')
    } catch (err) {
      toast.error('Save failed', friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !resume) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="container-app py-4 sm:py-6 lg:py-10">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold flex items-center gap-2">
              <FileText size={22} className="text-brand-600 shrink-0" />
              <span className="truncate">Resume Builder</span>
            </h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">
              Build a professional resume with AI assistance. Save or download
              as PDF.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-outline !py-2 !px-3 text-sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span className="hidden xs:inline">
                {saving ? 'Saving...' : 'Save'}
              </span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary !py-2 !px-3 text-sm"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile tab switcher — full width, sticky */}
      <div className="lg:hidden mb-4 sticky top-16 z-20 bg-white/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-100">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 w-full">
          <button
            onClick={() => setTab('edit')}
            className={`flex-1 justify-center px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 transition ${
              tab === 'edit'
                ? 'bg-brand-700 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 justify-center px-3 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 transition ${
              tab === 'preview'
                ? 'bg-brand-700 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* Left: form */}
        <div
          className={
            tab === 'preview'
              ? 'hidden lg:block min-w-0'
              : 'block min-w-0'
          }
        >
          <ResumeForm
            resume={resume}
            setResume={setResume}
            profile={profile}
          />
        </div>

        {/* Right: preview */}
        <div
          className={
            tab === 'edit' ? 'hidden lg:block min-w-0' : 'block min-w-0'
          }
        >
          <div className="lg:sticky lg:top-20">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Live preview
              <span className="ml-2 text-[10px] font-normal normal-case text-gray-400 hidden sm:inline">
                (scales to fit)
              </span>
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-100 p-2 sm:p-3 lg:p-4">
              <ScaleToFit baseWidth={A4_WIDTH_PX}>
                <div className="bg-white shadow-lg">
                  <ResumePreview ref={printRef} resume={resume} />
                </div>
              </ScaleToFit>
            </div>

            <p className="text-[11px] text-gray-400 mt-2 px-1">
              Print dialog → "Save as PDF" for the exact A4 output.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden print-only copy — always true A4 size for PDF export */}
      <div
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <ResumePreview ref={printRef} resume={resume} />
      </div>
    </div>
  )
}