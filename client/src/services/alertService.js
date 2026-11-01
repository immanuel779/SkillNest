import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../config/firebase'

export async function createCandidateAlert(employerId, data) {
  return await addDoc(collection(db, 'candidateAlerts'), {
    ...data,
    employerId,
    matchesCount: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// REAL-TIME LISTENER for Employer Dashboard
export function subscribeToMyAlerts(employerId, callback) {
  const q = query(
    collection(db, 'candidateAlerts'), 
    where('employerId', '==', employerId)
  )
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort by newest first
    alerts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
    callback(alerts)
  })
}

export async function deleteAlert(alertId) {
  await deleteDoc(doc(db, 'candidateAlerts', alertId))
}

export async function toggleAlertStatus(alertId, currentStatus) {
  await updateDoc(doc(db, 'candidateAlerts', alertId), {
    status: currentStatus === 'active' ? 'paused' : 'active',
    updatedAt: serverTimestamp()
  })
}