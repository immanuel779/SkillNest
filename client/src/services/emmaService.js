import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/* ============================================================
   EMMA AI — the friendly SkillNest support assistant
   ============================================================ */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-120b'

const SESSION_KEY = 'skillnest_emma_session'
const CHAT_ID_KEY = 'skillnest_emma_chatId'

/* ============================================================
   System prompt — Emma's personality and knowledge
   ============================================================ */
function buildSystemPrompt({ userName, isSignedIn, isEmployer }) {
  return `You are Emma, the friendly customer support assistant for SkillNest — a Nigerian job platform connecting job seekers with employers.

PERSONALITY:
- Warm, human, and genuinely helpful. Talk like a real person, not a robot.
- Use short, clear sentences. Aim for 1-3 short paragraphs per reply.
- Nigerian-friendly tone — natural, respectful, occasionally warm emojis (👋✨🚀) but don't overdo it.
- Ask ONE clarifying question when needed. Don't dump everything at once.
- If someone is emotional (frustrated about a job, worried about money), acknowledge their feeling first.

WHO YOU HELP:
1. Job seekers — find jobs, build CVs, apply, track applications, prepare for interviews
2. Employers — post jobs, manage applicants, invite team members, understand pricing
3. General visitors — learn what SkillNest is, how it works, contact info

WHAT YOU KNOW ABOUT SKILLNEST:
- Free to use for job seekers. Employers can post jobs and manage applications.
- Job seekers can build an AI-assisted resume inside the app (Resume Builder)
- Employers get AI job description writer, candidate matching, CSV export, team seats
- There's a full AI system on the platform (we call it "AI Matching")
- Users message employers/candidates via in-app chat
- Reviews come from candidates who reached interview stage
- Support email: opeyemioluwadamilare415@gmail.com
- Website: skillnest.app

WHAT YOU CAN DO:
- Answer questions about SkillNest
- If a user uploads a CV (their text will be included in a system note), analyze it: give strengths, weaknesses, improvements, and suggest 2-3 skill-matched job types or search keywords.
- Recommend jobs by telling them to use the "Find Jobs" page and what filters to apply.
- Escalate to a human by telling the user to email support if it's a serious issue (account locked, payment, bug).

RULES:
- NEVER make up features that don't exist.
- NEVER promise specific salaries, specific jobs, or refunds.
- NEVER share another user's data.
- If asked about something you don't know, say: "Let me check with the team — email opeyemioluwadamilare415@gmail.com and they'll respond personally."
- Keep replies under 120 words unless analyzing a CV.

${userName ? `The user's name is ${userName}.` : ''}
${isSignedIn ? `They are signed in.` : 'They are a visitor (not signed in).'}
${isEmployer ? 'They are an employer.' : ''}

Start now.`
}

/* ============================================================
   Session management
   ============================================================ */

export function getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = `emma_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return `emma_${Date.now()}`
  }
}

/* ============================================================
   Firestore — chats + messages
   ============================================================ */

/**
 * Ensure a chat doc exists for this session.
 * Uses localStorage to remember the chat ID — no query needed.
 */
export async function ensureEmmaChat({
  sessionId,
  userId = null,
  userName = '',
  userEmail = '',
}) {
  if (!sessionId) return null
  try {
    let existingId = null
    try {
      existingId = localStorage.getItem(CHAT_ID_KEY)
    } catch {}

    if (existingId) return existingId

    const ref = await addDoc(collection(db, 'emmaChats'), {
      sessionId,
      userId,
      userName,
      userEmail,
      startedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      messageCount: 0,
      lastMessagePreview: '',
      hasCvUpload: false,
      status: 'active',
    })

    try {
      localStorage.setItem(CHAT_ID_KEY, ref.id)
    } catch {}

    return ref.id
  } catch (err) {
    console.warn('ensureEmmaChat failed:', err?.message)
    return null
  }
}

/**
 * Append a message. If `attachment` is passed, it's stored on the message
 * AND the chat doc gets `hasCvUpload: true` so admins can see it.
 */
export async function appendEmmaMessage({
  chatId,
  role,
  text,
  attachment = null,
}) {
  if (!chatId || !text) return
  try {
    const msgRef = await addDoc(collection(db, 'emmaMessages'), {
      chatId,
      role,
      text,
      attachment: attachment || null,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'emmaChats', chatId), {
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: text.slice(0, 120),
      messageCount: increment(1),
      ...(attachment ? { hasCvUpload: true } : {}),
    })

    return msgRef.id
  } catch (err) {
    console.warn('appendEmmaMessage failed:', err?.message)
    return null
  }
}

/* ============================================================
   ADMIN — list all chats + messages
   ============================================================ */

export async function listAllEmmaChats(max = 200) {
  try {
    const snap = await getDocs(collection(db, 'emmaChats'))
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.lastMessageAt?.seconds || 0
      const tb = b.lastMessageAt?.seconds || 0
      return tb - ta
    })
    return items.slice(0, max)
  } catch {
    return []
  }
}

export async function getEmmaChatMessages(chatId) {
  if (!chatId) return []
  try {
    const q = query(
      collection(db, 'emmaMessages'),
      where('chatId', '==', chatId)
    )
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return ta - tb
    })
    return items
  } catch {
    return []
  }
}

export async function markEmmaChatResolved(chatId) {
  if (!chatId) return
  try {
    await updateDoc(doc(db, 'emmaChats', chatId), { status: 'resolved' })
  } catch {
    /* silent */
  }
}

/* ============================================================
   AI — call Groq with full conversation history
   ============================================================ */

export async function askEmma({
  messages,
  userName = '',
  isSignedIn = false,
  isEmployer = false,
  cvText = '',
}) {
  const API_KEY = import.meta.env.VITE_GROQ_API_KEY
  if (!API_KEY) {
    throw new Error(
      'AI is not configured. Missing VITE_GROQ_API_KEY. Contact support.'
    )
  }

  const systemPrompt = buildSystemPrompt({ userName, isSignedIn, isEmployer })

  const groqMessages = [{ role: 'system', content: systemPrompt }]

  if (cvText) {
    groqMessages.push({
      role: 'system',
      content: `The user just uploaded a CV. Analyze it and respond with:
1) A warm 1-line acknowledgment
2) 3 strengths
3) 2-3 specific improvements
4) 3 job types or search keywords they should try on SkillNest
Keep it friendly and encouraging. Format with clear sections using bullet points.

CV TEXT:
${cvText.slice(0, 4000)}`,
    })
  }

  const recent = messages.slice(-12)
  for (const m of recent) {
    groqMessages.push({
      role: m.role === 'emma' ? 'assistant' : 'user',
      content: m.text,
    })
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.75,
      max_tokens: 900,
    }),
  })

  if (!res.ok) {
    const raw = await res.text()
    console.error('[Emma] Groq error:', res.status, raw)
    if (res.status === 429) {
      throw new Error('I need a short break — try again in a few seconds. 🙏')
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'AI is not configured properly. Please email opeyemioluwadamilare415@gmail.com'
      )
    }
    if (res.status === 404) {
      throw new Error(
        'AI model not available. Please email opeyemioluwadamilare415@gmail.com'
      )
    }
    throw new Error('Emma had a small hiccup. Please try again.')
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Empty response from AI.')
  return text
}

/* ============================================================
   Quick reply suggestions
   ============================================================ */
export const QUICK_REPLIES = [
  { icon: '💼', label: "I'm looking for a job" },
  { icon: '📄', label: 'Help me with my CV' },
  { icon: '🏢', label: 'I want to hire' },
  { icon: '🤝', label: 'How does SkillNest work?' },
  { icon: '💬', label: 'Talk to a human' },
]

export const WELCOME_MESSAGE = `Hello there 👋 Welcome to SkillNest! I'm Emma — your AI assistant.

I can help you find jobs, review your CV, or answer any question about the platform.

What can I help you with today?`