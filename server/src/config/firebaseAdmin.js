import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { env } from './env.js'

function buildCredential() {
  const { serviceAccountJson, serviceAccountPath, projectId } = env.firebase

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson)
      return { credential: cert(parsed), projectId: parsed.project_id || projectId }
    } catch (err) {
      console.warn('⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back.')
    }
  }

  if (serviceAccountPath) {
    try {
      const raw = readFileSync(serviceAccountPath, 'utf8')
      const parsed = JSON.parse(raw)
      return { credential: cert(parsed), projectId: parsed.project_id || projectId }
    } catch (err) {
      console.warn('⚠️  Could not read FIREBASE_SERVICE_ACCOUNT_PATH, falling back.')
    }
  }

  // Fallback — Application Default Credentials
  return { credential: applicationDefault(), projectId }
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(buildCredential())

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
export const FieldValueAdmin = FieldValue
export const TimestampAdmin = Timestamp