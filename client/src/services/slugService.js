import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const RESERVED = new Set([
  'admin', 'api', 'app', 'about', 'auth', 'blog', 'c', 'careers',
  'companies', 'company', 'contact', 'dashboard', 'employer', 'help',
  'interviews', 'jobs', 'landing', 'login', 'logout', 'messages',
  'notifications', 'pricing', 'privacy', 'profile', 'register',
  'reports', 'saved-jobs', 'search', 'security', 'signup', 'support',
  'terms', 'user', 'users', 'verify', 'settings', 'new', 'edit',
])

/** Turn a display name into a valid slug. */
export function toSlug(name) {
  return (name || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** Returns true if the slug is syntactically valid (ignores availability). */
export function isSlugFormatValid(slug) {
  if (!slug) return false
  if (slug.length < 3 || slug.length > 40) return false
  if (RESERVED.has(slug)) return false
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)
}

/** Human-readable reason why the slug is invalid. */
export function slugErrorReason(slug) {
  if (!slug || slug.length < 3) return 'Slug must be at least 3 characters.'
  if (slug.length > 40) return 'Slug must be 40 characters or fewer.'
  if (RESERVED.has(slug)) return 'That name is reserved. Please choose another.'
  if (!/^[a-z0-9]/.test(slug)) return 'Slug must start with a letter or number.'
  if (!/[a-z0-9]$/.test(slug)) return 'Slug must end with a letter or number.'
  if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug can only contain lowercase letters, numbers, and hyphens.'
  return 'Invalid slug.'
}

/** True if the slug is not yet reserved by any company. */
export async function isSlugAvailable(slug) {
  const snap = await getDoc(doc(db, 'slugReservations', slug))
  return !snap.exists()
}

/**
 * Reserve a slug for a company.
 * If taken, auto-suggests acme-inc-2, -3, etc.
 * Returns the final slug used.
 */
export async function reserveSlug(companyId, desiredSlug, ownerUid) {
  const base = toSlug(desiredSlug)
  if (!isSlugFormatValid(base)) throw new Error(slugErrorReason(base))

  let candidate = base
  let attempt = 1
  while (attempt < 20) {
    if (await isSlugAvailable(candidate)) {
      await setDoc(doc(db, 'slugReservations', candidate), {
        slug: candidate,
        companyId,
        ownerUid,
        createdAt: serverTimestamp(),
      })
      return candidate
    }
    attempt++
    candidate = `${base}-${attempt}`
  }
  throw new Error('Could not find an available slug. Try another name.')
}

/** Free a slug — used when a company changes its slug. */
export async function releaseSlug(slug) {
  if (!slug) return
  try {
    await deleteDoc(doc(db, 'slugReservations', slug))
  } catch {
    /* best-effort */
  }
}