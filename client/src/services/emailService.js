/**
 * Send a transactional email via our Vercel serverless function.
 * Always silent on failure — email is best-effort.
 *
 * Events:
 *   - application_received   { jobTitle, companyName, candidateEmail }
 *   - status_change          { status, jobTitle, companyName }
 *   - interview_scheduled    { jobTitle, companyName, whenText, durationMin, meetingLink }
 *   - new_message            { senderName, preview }
 */
export async function sendEmail(event, to, payload) {
  if (!to) return false
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, to, payload }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn('sendEmail failed:', data?.error || res.status)
      return false
    }
    return true
  } catch (err) {
    console.warn('sendEmail error:', err?.message)
    return false
  }
}