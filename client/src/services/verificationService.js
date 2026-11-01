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

// 1. Submit a new verification request
export async function submitVerification(companyId, userId, data) {
  const ref = await addDoc(collection(db, 'verifications'), {
    companyId,
    userId,
    ...data,
    status: 'pending',
    submittedAt: serverTimestamp(),
  })
  return ref.id
}

// 2. Get the user's current verification status
export async function getMyVerification(companyId) {
  const q = query(collection(db, 'verifications'), where('companyId', '==', companyId))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return items.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))[0]
}

// 3. Admin: List all pending requests
export async function listPendingVerifications() {
  const q = query(collection(db, 'verifications'), where('status', '==', 'pending'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// 4. Admin: Approve
export async function approveVerification(verificationId, companyId, userId) {
  // Update verification status
  await updateDoc(doc(db, 'verifications', verificationId), { 
    status: 'approved',
    reviewedAt: serverTimestamp() 
  })
  
  // Update company to verified
  await updateDoc(doc(db, 'companies', companyId), { 
    verified: true 
  })

  // Notify the employer
  await createNotification({
    userId,
    type: 'verification',
    title: '✅ Company Verified',
    body: 'Your business has been verified. You can now post jobs!',
    link: '/employer/jobs/new'
  })
}

// 5. Admin: Reject
export async function rejectVerification(verificationId, userId, reason) {
  await updateDoc(doc(db, 'verifications', verificationId), { 
    status: 'rejected',
    rejectionReason: reason || 'Documents do not meet our requirements.',
    reviewedAt: serverTimestamp()
  })

  await createNotification({
    userId,
    type: 'verification',
    title: '❌ Verification Rejected',
    body: reason || 'Please check your documents and try again.',
    link: '/employer/verification'
  })
}