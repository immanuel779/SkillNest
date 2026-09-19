/**
 * Client-side email service.
 * Calls our Vercel serverless function at /api/email, which sends via Resend.
 * Always silent on failure — email is best-effort.
 *
 * Events:
 *   - application_received   { jobTitle, companyName, candidateEmail }
 *   - status_change          { status, jobTitle, companyName }
 *   - interview_scheduled    { jobTitle, companyName, whenText, durationMin, meetingLink }
 *   - new_message            { senderName, preview }
 *   - team_invite            { companyName, inviterName, role, inviteUrl }
 */
export async function sendEmail(event, to, payload) {
  if (!to) return false
  try {
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, to, payload }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('[sendEmail] failed:', res.status, data)
      return false
    }

    console.log('[sendEmail] sent:', data)
    return true
  } catch (err) {
    console.error('[sendEmail] error:', err)
    return false
  }
}