const API_KEY = import.meta.env.VITE_GROQ_API_KEY

if (!API_KEY) {
  console.warn(
    '⚠️ VITE_GROQ_API_KEY missing. AI features will be disabled. Add it to .env'
  )
}

const MODEL = 'openai/gpt-oss-120b'
const BASE_URL = 'https://api.groq.com/openai/v1'

/**
 * Call Groq via its OpenAI-compatible chat completions endpoint.
 * Auth is sent as a standard Bearer token.
 */
async function generate(prompt, options = {}) {
  if (!API_KEY) {
    throw new Error(
      'AI is not configured. Add VITE_GROQ_API_KEY to your .env file.'
    )
  }

  const url = `${BASE_URL}/chat/completions`

  const body = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxOutputTokens ?? 1024,
  }

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[aiService] Network error:', err)
    throw new Error('Could not reach Groq API. Check your connection.')
  }

  if (!res.ok) {
    const raw = await res.text()
    console.error('[aiService] Groq error:', res.status, raw)

    let parsed = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      /* not JSON */
    }
    const msg = parsed?.error?.message || raw || `HTTP ${res.status}`

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'API key rejected. Make sure VITE_GROQ_API_KEY is a valid key from console.groq.com and restart the dev server.'
      )
    }
    if (res.status === 429) {
      throw new Error('Rate limit hit. Wait a minute and try again.')
    }
    if (res.status === 404) {
      throw new Error(
        `Model "${MODEL}" not available on your key. Try another model.`
      )
    }
    throw new Error(msg)
  }

  const data = await res.json()

  const text = data?.choices?.[0]?.message?.content?.trim() || ''

  if (!text) {
    throw new Error('Empty response from AI. Try again.')
  }

  return text
}

/* ============================================================
   1. AI JOB DESCRIPTION WRITER
   ============================================================ */
export async function generateJobDescription({
  title,
  companyName,
  location,
  jobType,
  workMode,
  experienceLevel,
  category,
  keySkills = [],
}) {
  const skillsLine =
    keySkills.length > 0 ? `Required skills: ${keySkills.join(', ')}` : ''

  const prompt = `You are an expert recruiter writing a compelling job posting.

Write a professional job description with these details:
- Job title: ${title}
- Company: ${companyName || 'the company'}
- Location: ${location || 'Not specified'}
- Job type: ${jobType || 'Full-time'}
- Work mode: ${workMode || 'On-site'}
- Experience level: ${experienceLevel || 'Mid'}
- Category: ${category || 'General'}
${skillsLine}

Structure your response EXACTLY with these sections, each on its own line:

ABOUT THE ROLE:
[2-3 sentences describing the role and its impact]

RESPONSIBILITIES:
- [responsibility 1]
- [responsibility 2]
- [responsibility 3]
- [responsibility 4]
- [responsibility 5]

REQUIREMENTS:
- [requirement 1]
- [requirement 2]
- [requirement 3]
- [requirement 4]

NICE TO HAVE:
- [nice to have 1]
- [nice to have 2]

Keep the tone professional but warm. Use plain text, no markdown, no asterisks. Do not invent a salary.`

  return generate(prompt, { temperature: 0.7, maxOutputTokens: 1200 })
}

/* ============================================================
   2. AI COVER LETTER ASSIST
   ============================================================ */
export async function generateCoverLetter({
  jobTitle,
  companyName,
  jobDescription,
  candidateName,
  candidateHeadline,
  candidateSkills = [],
  candidateExperience = '',
  tone = 'professional',
}) {
  const prompt = `Write a compelling cover letter for this job application.

JOB:
- Title: ${jobTitle}
- Company: ${companyName}
- Description excerpt: ${(jobDescription || '').slice(0, 800)}

CANDIDATE:
- Name: ${candidateName || 'the applicant'}
- Headline: ${candidateHeadline || 'Not provided'}
- Skills: ${candidateSkills.join(', ') || 'Not listed'}
- Experience: ${candidateExperience || 'Not provided'}

Tone: ${tone}

Write a 3-4 paragraph cover letter. Start with "Dear Hiring Manager," and end with "Sincerely,\n${candidateName || 'Your name'}". Do not use placeholders like [Company] — use the real values above. Keep it under 300 words. Plain text only, no markdown.`

  return generate(prompt, { temperature: 0.8, maxOutputTokens: 800 })
}

/* ============================================================
   3. AI RESUME FEEDBACK
   ============================================================ */
export async function generateResumeFeedback({
  resumeText,
  targetRole,
  candidateHeadline,
}) {
  const prompt = `You are an expert career coach reviewing a resume.

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${candidateHeadline ? `CANDIDATE HEADLINE: ${candidateHeadline}` : ''}

RESUME:
${(resumeText || '').slice(0, 4000)}

Give structured feedback using EXACTLY these sections:

OVERALL SCORE:
[X/10] — one sentence summary

STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]

WEAKNESSES:
- [weakness 1]
- [weakness 2]
- [weakness 3]

IMPROVEMENTS:
- [specific action 1]
- [specific action 2]
- [specific action 3]
- [specific action 4]

ATS TIPS:
- [tip 1]
- [tip 2]

Be direct and specific. Do not be vague. Plain text, no markdown, no asterisks.`

  return generate(prompt, { temperature: 0.6, maxOutputTokens: 1200 })
}

/* ============================================================
   4. SMART CANDIDATE MATCHING
   ============================================================ */
export async function scoreCandidateMatch({ job, candidate }) {
  const prompt = `You are scoring a candidate match for a job. Be objective.

JOB:
- Title: ${job.title}
- Description: ${(job.description || '').slice(0, 1000)}
- Required skills: ${(job.skills || []).join(', ') || 'Not specified'}
- Experience level: ${job.experienceLevel || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Work mode: ${job.workMode || 'Not specified'}

CANDIDATE:
- Name: ${candidate.fullName || 'Unknown'}
- Headline: ${candidate.headline || 'Not provided'}
- Skills: ${(candidate.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).join(', ') || 'Not listed'}
- Experience summary: ${(candidate.bio || candidate.summary || '').slice(0, 600)}
- Location: ${candidate.location || 'Not provided'}

Respond ONLY in this exact format, no extra text:

SCORE: [0-100]

SUMMARY: [one sentence explaining the score]

STRENGTHS:
- [strength 1]
- [strength 2]

GAPS:
- [gap 1]
- [gap 2]

RECOMMENDATION: [Strong Match / Good Match / Possible Match / Weak Match]`

  return generate(prompt, { temperature: 0.4, maxOutputTokens: 500 })
}