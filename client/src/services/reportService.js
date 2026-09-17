import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export const REPORT_REASONS = [
  'Fake or scam job',
  'Spam or duplicate',
  'Offensive content',
  'Misleading information',
  'Discriminatory requirements',
  'Other',
]

export async function createReport({
  reporterId,
  targetType,
  targetId,
  reason,
  details = '',
}) {
  if (!reporterId || !targetType || !targetId || !reason) {
    throw new Error('Missing required fields for report')
  }

  const ref = await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType,
    targetId,
    reason,
    details,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}