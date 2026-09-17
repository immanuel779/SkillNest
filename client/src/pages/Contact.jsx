import { useState } from 'react'
import { StaticPage, Section } from '../components/StaticPage'
import {
  Mail,
  MessageSquare,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const CONTACT_EMAIL = 'opeyemioluwadamilare415@gmail.com'
const SUPPORT_EMAIL = 'opeyemioluwadamilare415@gmail.com'
const WEB3FORMS_KEY = 'ab255645-21ab-41f5-b8d3-7f7aadca7cd6'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.message) {
      setError('Please fill in name, email, and message.')
      return
    }

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('access_key', WEB3FORMS_KEY)
      formData.append('name', form.name)
      formData.append('email', form.email)
      formData.append(
        'subject',
        form.subject || `SkillNest message from ${form.name}`
      )
      formData.append('message', form.message)
      formData.append('from_name', 'SkillNest Contact Form')

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not send message')
      }

      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const cards = [
    {
      icon: Mail,
      label: 'Email',
      hint: 'General enquiries',
      href: `mailto:${CONTACT_EMAIL}`,
      color: 'brand',
    },
    {
      icon: MessageSquare,
      label: 'Support',
      hint: 'Account & technical help',
      href: `mailto:${SUPPORT_EMAIL}`,
      color: 'accent',
    },
  ]

  return (
    <StaticPage
      title="Contact Us"
      subtitle="We usually respond within one business day."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="card card-hover block">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                c.color === 'brand'
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-accent-50 text-accent-600'
              }`}
            >
              <c.icon size={18} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">{c.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{c.hint}</p>
            <span className="text-xs font-semibold text-brand-700 mt-3 inline-block">
              Get in touch →
            </span>
          </a>
        ))}
        <div className="card">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-3">
            <MapPin size={18} />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Office</h3>
          <p className="text-xs text-gray-500 mt-1">Lagos, Nigeria</p>
        </div>
      </div>

      <Section title="Send us a message">
        {sent ? (
          <div className="flex items-start gap-3 text-green-700">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Message sent successfully.</p>
              <p className="text-sm text-gray-600 mt-1">
                Thanks for reaching out — we'll reply within one business day
                at <strong>{form.email}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Your name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Subject</label>
              <input
                className="input"
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input resize-none"
                rows={6}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                placeholder="Tell us more..."
                required
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary">
              <Send size={16} /> {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </Section>
    </StaticPage>
  )
}