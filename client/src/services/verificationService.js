import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

/* ============================================================
   1. EMPLOYER: Submit a new verification request
   ============================================================ */
export async function submitVerification(companyId, userId, data) {
  if (!companyId || !userId) throw new Error('Missing company or user ID')
  
  try {
    const ref = await addDoc(collection(db, 'verifications'), {
      companyId,
      userId,
      ...data, // This includes companyName, documents array, etc.
      status: 'pending',
      submittedAt: serverTimestamp(),
      reviewedAt: null,
      rejectionReason: null,
    })
    return ref.id
  } catch (err) {
    console.error('Failed to submit verification:', err)
    throw err
  }
}

/* ============================================================
   2. EMPLOYER: Get the user's current verification status
   ============================================================ */
export async function getMyVerification(companyId) {
  if (!companyId) return null
  
  try {
    const q = query(collection(db, 'verifications'), where('companyId', '==', companyId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    // Sort by newest first (using submittedAt)
    return items.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))[0]
  } catch (err) {
    console.warn('Failed to get verification:', err.message)
    return null
  }
}

/* ============================================================
   3. ADMIN: Fetch ALL verifications (for the new Tabs UI)
   ============================================================ */
export async function listAllVerifications() {
  try {
    const snap = await getDocs(collection(db, 'verifications'))
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Sort by newest first in JavaScript (Prevents Firebase Index errors)
    items.sort((a, b) => {
      const ta = a.submittedAt?.seconds || 0
      const tb = b.submittedAt?.seconds || 0
      return tb - ta
    })
    return items
  } catch (err) {
    console.warn('Failed to list all verifications:', err.message)
    return []
  }
}

/* ============================================================
   4. ADMIN: Universal Status Update (Approve, Reject, or Pending)
   ============================================================ */
export async function updateVerificationStatus(verificationId, newStatus, companyId, userId, reason = '') {
  if (!verificationId) throw new Error('Verification ID required')
  
  try {
    // 1. Prepare the update payload for the verification document
    const payload = {
      status: newStatus,
      reviewedAt: serverTimestamp(),
    }
    
    if (newStatus === 'rejected') {
      payload.rejectionReason = reason || 'Documents do not meet our requirements.'
    } else if (newStatus === 'approved') {
      payload.rejectionReason = null
    }

    // 2. Update the verification document
    await updateDoc(doc(db, 'verifications', verificationId), payload)

    // 3. Update the Company's `verified` status
    if (companyId) {
      await updateDoc(doc(db, 'companies', companyId), {
        verified: newStatus === 'approved',
        updatedAt: serverTimestamp()
      }).catch(err => console.warn('Could not update company doc:', err.message))
    }

    // 4. Send Notification to the Employer (if userId is provided)
    if (userId) {
      if (newStatus === 'approved') {
        await createNotification({
          userId,
          type: 'verification',
          title: '✅ Company Verified',
          body: 'Your business has been verified. You can now post jobs!',
          link: '/employer/jobs/new'
        }).catch(() => {})

      } else if (newStatus === 'rejected') {
        await createNotification({
          userId,
          type: 'verification',
          title: '❌ Verification Rejected',
          body: reason || 'Please check your documents and try again.',
          link: '/employer/verification'
        }).catch(() => {})
      } else if (newStatus === 'pending') {
        await createNotification({
          userId,
          type: 'verification',
          title: '⏳ Verification Pending',
          body: 'Your verification has been moved back to pending review.',
          link: '/employer/verification'
        }).catch(() => {})
      }
    }

    return true
  } catch (err) {
    console.error(`Failed to update verification to ${newStatus}:`, err)
    throw err
  }
}

/* ============================================================
   5. ADMIN: Quick Approve (Legacy support)
   ============================================================ */
export async function approveVerification(verificationId, companyId, userId) {
  return updateVerificationStatus(verificationId, 'approved', companyId, userId)
}

/* ============================================================
   6. ADMIN: Quick Reject (Legacy support)
   ============================================================ */
export async function rejectVerification(verificationId, companyId, userId, reason) {
  return updateVerificationStatus(verificationId, 'rejected', companyId, userId, reason)
}