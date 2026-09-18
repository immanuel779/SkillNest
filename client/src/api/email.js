// Vercel Serverless Function — runs at https://skill-nest-kopb.vercel.app/api/email
// Sends transactional emails via Resend.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'SkillNest <onboarding@resend.dev>' // change once you verify a domain
const SITE_URL = 'https://skill-nest-kopb.vercel.app'

const ALLOWED_ORIGINS = [
  'https://skill-nest-kopb.vercel.app',
  'http://localhost:5173',
]

function escape(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* =========================
   Email templates
   ========================= */

function layout({ heading, intro, ctaLabel, ctaHref, footer }) {
  return `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#6d28d9 0%,#4c1d95 100%);">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">SkillNest</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;">Where Talent Meets Opportunity</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.01em;">${heading}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${intro}</p>
              ${
                ctaLabel && ctaHref
                  ? `<a href="${ctaHref}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">${ctaLabel}</a>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function templateApplicationReceived({ jobTitle, companyName, candidateEmail }) {
  return {
    subject: `New application for "${jobTitle}"`,
    html: layout({
      heading: '📥 New application received',
      intro: `<strong>${escape(candidateEmail)}</strong> has applied to <strong>${escape(jobTitle)}</strong> at <strong>${escape(companyName)}</strong>. Review their profile and resume from your dashboard.`,
      ctaLabel: 'View applicant',
      ctaHref: `${SITE_URL}/employer/jobs`,
      footer: 'You are receiving this because you posted this job on SkillNest.',
    }),
  }
}

function templateStatusChange({ status, jobTitle, companyName }) {
  const map = {
    under_review: {
      emoji: '📋',
      heading: 'Your application is under review',
      intro: `<strong>${escape(companyName)}</strong> is reviewing your application for <strong>${escape(jobTitle)}</strong>. We'll be in touch soon.`,
    },
    shortlisted: {
      emoji: '⭐',
      heading: "You've been shortlisted!",
      intro: `Great news — <strong>${escape(companyName)}</strong> has shortlisted you for <strong>${escape(jobTitle)}</strong>. Watch for an interview invite.`,
    },
    interview: {
      emoji: '📅',
      heading: 'Interview stage reached',
      intro: `You've progressed to the interview stage for <strong>${escape(jobTitle)}</strong> at <strong>${escape(companyName)}</strong>.`,
    },
    hired: {
      emoji: '🎉',
      heading: "You've been hired!",
      intro: `Congratulations — <strong>${escape(companyName)}</strong> has hired you for <strong>${escape(jobTitle)}</strong>.`,
    },
    rejected: {
      emoji: '📭',
      heading: 'Application update',
      intro: `<strong>${escape(companyName)}</strong> has moved forward with other candidates for <strong>${escape(jobTitle)}</strong>. Keep applying — the right role is out there.`,
    },
    applied: {
      emoji: '✅',
      heading: 'Application received',
      intro: `Your application for <strong>${escape(jobTitle)}</strong> at <strong>${escape(companyName)}</strong> has been submitted.`,
    },
  }
  const t = map[status] || map.applied
  return {
    subject: `${t.emoji} ${t.heading}`,
    html: layout({
      heading: `${t.emoji} ${t.heading}`,
      intro: t.intro,
      ctaLabel: 'View application',
      ctaHref: `${SITE_URL}/applications`,
      footer: 'You are receiving this because you applied for this role on SkillNest.',
    }),
  }
}

function templateInterviewScheduled({
  jobTitle,
  companyName,
  whenText,
  durationMin,
  meetingLink,
}) {
  const linkBlock = meetingLink
    ? `<p style="margin:16px 0 0;font-size:14px;color:#4b5563;"><strong>Meeting link:</strong> <a href="${escape(
        meetingLink
      )}" style="color:#6d28d9;">${escape(meetingLink)}</a></p>`
    : ''
  return {
    subject: `📅 Interview scheduled — ${jobTitle}`,
    html: layout({
      heading: '📅 Interview scheduled',
      intro: `<strong>${escape(companyName)}</strong> has scheduled an interview for <strong>${escape(
        jobTitle
      )}</strong>.<br><br><strong>When:</strong> ${escape(
        whenText
      )}<br><strong>Duration:</strong> ${escape(durationMin)} minutes${linkBlock ? '' : ''}`,
      ctaLabel: 'View interview details',
      ctaHref: `${SITE_URL}/interviews`,
      footer: 'You are receiving this because you applied for this role on SkillNest.',
    }),
  }
}

function templateNewMessage({ senderName, preview }) {
  return {
    subject: `💬 New message from ${senderName}`,
    html: layout({
      heading: '💬 You have a new message',
      intro: `<strong>${escape(
        senderName
      )}</strong> sent you a message on SkillNest:<br><br><em style="color:#6b7280;">"${escape(
        preview
      )}"</em>`,
      ctaLabel: 'Open conversation',
      ctaHref: `${SITE_URL}/messages`,
      footer: 'Reply directly from your SkillNest inbox.',
    }),
  }
}

function templateTeamInvite({ companyName, inviterName, role, inviteUrl }) {
  const roleText =
    {
      recruiter:
        'a Recruiter (can post jobs, review applicants, and message candidates)',
      viewer: 'a Viewer (read-only access to applicants and jobs)',
      owner: 'an Owner (full access)',
    }[role] || 'a team member'

  return {
    subject: `You're invited to join ${companyName} on SkillNest`,
    html: layout({
      heading: `👋 You're invited to join ${companyName}`,
      intro: `<strong>${escape(
        inviterName
      )}</strong> invited you to help hire on SkillNest as ${roleText}.<br><br>Click below to accept. The link expires in 7 days.`,
      ctaLabel: 'Accept invite',
      ctaHref: inviteUrl,
      footer:
        "If you weren't expecting this, you can safely ignore the email.",
    }),
  }
}

function buildTemplate(event, payload) {
  switch (event) {
    case 'application_received':
      return templateApplicationReceived(payload)
    case 'status_change':
      return templateStatusChange(payload)
    case 'interview_scheduled':
      return templateInterviewScheduled(payload)
    case 'new_message':
      return templateNewMessage(payload)
    case 'team_invite':
      return templateTeamInvite(payload)
    default:
      return null
  }
}

/* =========================
   Handler
   ========================= */

export default async function handler(req, res) {
  // CORS — only allow our own origins
  const origin = req.headers.origin || ''
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'Email service not configured' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }

  const { event, to, payload } = body || {}

  if (!event || !to) {
    return res.status(400).json({ error: 'event and to are required' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email' })
  }

  const template = buildTemplate(event, payload || {})
  if (!template) {
    return res.status(400).json({ error: `Unknown event: ${event}` })
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      console.error('Resend error:', data)
      return res.status(resp.status).json({
        error: data?.message || 'Failed to send email',
      })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (err) {
    console.error('Email send failed:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}