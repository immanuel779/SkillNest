import { useState, useRef, useEffect } from 'react'
import {
  Share2,
  MessageCircle,
  Send,
  Globe,
  Link as LinkIcon,
  Check,
} from 'lucide-react'

export default function CompanyShareMenu({ url, title }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const text = `Check out ${title} on SkillNest`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  const links = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: 'text-green-600',
    },
    {
      label: 'Twitter / X',
      icon: Send,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: 'text-gray-800',
    },
    {
      label: 'LinkedIn',
      icon: Globe,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'text-blue-600',
    },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-outline !py-2 !px-3 text-sm"
      >
        <Share2 size={14} /> Share
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0"
            >
              <l.icon size={16} className={l.color} />
              <span className="text-sm font-medium text-gray-800">
                {l.label}
              </span>
            </a>
          ))}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-t border-gray-100"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Link copied
                </span>
              </>
            ) : (
              <>
                <LinkIcon size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  Copy link
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}