import { useState } from 'react'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { subscribeToNewsletter } from '../../services/newsletterService'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await subscribeToNewsletter(email)
      setDone(true)
      setEmail('')
      if (res.alreadySubscribed) {
        setError('You are already subscribed — we have got you.')
      }
    } catch (err) {
      setError(err.message || 'Could not subscribe.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container-app pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 md:px-12 md:py-14 shadow-2xl shadow-brand-900/20">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge bg-white/15 text-white border border-white/20 backdrop-blur">
            <Mail size={13} className="text-accent-300" />
            Weekly Job Alerts
          </div>
          <h3 className="mt-5 text-2xl md:text-3xl font-extrabold text-white text-balance">
            Never miss a job again
          </h3>
          <p className="mt-3 text-white/80">
            Get the freshest verified roles in your inbox. Free. Unsubscribe
            anytime.
          </p>

          {done ? (
            <div className="mt-8 inline-flex items-center gap-2 bg-white/15 text-white rounded-xl px-5 py-3 border border-white/20 backdrop-blur">
              <CheckCircle2 size={16} className="text-accent-300" />
              <span className="font-semibold">You are subscribed</span>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-xl px-4 py-3 bg-white/95 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-white/30"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-800 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Subscribe
              </button>
            </form>
          )}

          {error && (
            <p className="mt-3 text-sm text-white/90">{error}</p>
          )}
        </div>
      </div>
    </section>
  )
}