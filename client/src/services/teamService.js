import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { sendEmail } from './emailService'

/**
 * Generate a URL-safe random token for the invite.
 */
function randomToken(length = 32) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

/**
 * Create a team invite and email it.
 * Roles: 'owner' | 'recruiter' | 'viewer'
 */
export async function inviteTeamMember({
  companyId,
  companyName,
  invitedBy,
  inviterName,
  invitedEmail,
  role,
}) {
  if (!companyId || !invitedEmail || !role) {
    throw new Error('Missing required fields')
  }

  const token = randomToken(32)
  const ref = doc(db, 'teamInvites', token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await setDoc(ref, {
    token,
    companyId,
    companyName: companyName || '',
    invitedBy,
    inviterName: inviterName || '',
    invitedEmail: invitedEmail.trim().toLowerCase(),
    role,
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt,
  })

  const inviteUrl = `${window.location.origin}/accept-invite/${token}`

  // Best-effort email — never blocks the flow
  sendEmail('team_invite', invitedEmail, {
    companyName: companyName || 'a company',
    inviterName: inviterName || 'A team member',
    role,
    inviteUrl,
  }).catch(() => {})

  return { token, inviteUrl }
}

/**
 * Look up an invite by token.
 */
export async function getInvite(token) {
  if (!token) return null
  const snap = await getDoc(doc(db, 'teamInvites', token))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Accept an invite: link this user to the company and mark the invite accepted.
 */
export async function acceptInvite({ token, userId }) {
  const invite = await getInvite(token)
  if (!invite) throw new Error('Invite not found')
  if (invite.status === 'accepted') throw new Error('Invite already used')
  if (invite.status === 'revoked') throw new Error('Invite was revoked')

  const expiresAt = invite.expiresAt
  if (expiresAt) {
    const exp = expiresAt.seconds
      ? new Date(expiresAt.seconds * 1000)
      : new Date(expiresAt)
    if (exp.getTime() < Date.now()) throw new Error('Invite has expired')
  }

  // Update the user doc so security rules can validate company membership
  await updateDoc(doc(db, 'users', userId), {
    companyId: invite.companyId,
    teamRole: invite.role,
    updatedAt: serverTimestamp(),
  })

  // Mark invite as accepted
  await updateDoc(doc(db, 'teamInvites', token), {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    acceptedBy: userId,
  })

  return invite
}

/**
 * Cancel / revoke a pending invite.
 */
export async function revokeInvite(token) {
  await updateDoc(doc(db, 'teamInvites', token), {
    status: 'revoked',
    revokedAt: serverTimestamp(),
  })
}

export { randomToken }