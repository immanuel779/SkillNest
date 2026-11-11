import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

/* ============================================================
   1. AD PACKAGES
   ============================================================ */

const PACKAGES_DOC = 'adPackages'
const SEEDED_DOC = 'adsPackagesSeeded'

export const DEFAULT_PACKAGES = [
  { id: 'starter', name: 'Starter', price: 5000, currency: 'NGN', durationDays: 7, impressions: '1,000+', order: 1, features: ['7-day campaign', 'Landing page placement', 'Logo + headline + CTA', 'Basic impressions count'], highlighted: false, active: true },
  { id: 'basic', name: 'Basic', price: 15000, currency: 'NGN', durationDays: 30, impressions: '10,000+', order: 2, features: ['30-day campaign', 'Landing + dashboard placement', 'Bigger banner (with image)', 'Click + view metrics', 'Priority over Starter'], highlighted: false, active: true },
  { id: 'premium', name: 'Premium', price: 50000, currency: 'NGN', durationDays: 90, impressions: '50,000+', order: 3, features: ['90-day campaign', 'Landing + dashboard + emails', 'Featured badge on ad', 'Video / rich media support', 'Advanced analytics', 'Priority support'], highlighted: true, active: true },
  { id: 'enterprise', name: 'Enterprise', price: 200000, currency: 'NGN', durationDays: 365, impressions: 'Unlimited', order: 4, features: ['365-day campaign', 'All placements + newsletters', 'Custom targeting by state', 'Multiple ad creatives', 'Dedicated account manager', 'Monthly performance report'], highlighted: false, active: true },
]

export async function listAdPackages() {
  try {
    const snap = await getDocs(collection(db, PACKAGES_DOC))
    if (snap.empty) return DEFAULT_PACKAGES
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return items.filter((p) => p.active !== false)
  } catch { return DEFAULT_PACKAGES }
}

export async function seedAdPackages() {
  try {
    const seedSnap = await getDoc(doc(db, 'siteConfig', SEEDED_DOC))
    if (seedSnap.exists()) return
    for (const p of DEFAULT_PACKAGES) { await setDoc(doc(db, PACKAGES_DOC, p.id), p) }
    await setDoc(doc(db, 'siteConfig', SEEDED_DOC), { seededAt: serverTimestamp() })
  } catch (err) { console.warn('seedAdPackages failed:', err?.message) }
}

/* ============================================================
   2. AD SUBMISSIONS
   ============================================================ */

export async function submitAd(data) {
  if (!data.businessName?.trim() || !data.headline?.trim() || !data.ctaUrl?.trim()) {
    throw new Error('Business name, headline, and CTA URL are required')
  }
  const ref = await addDoc(collection(db, 'adSubmissions'), {
    ...data,
    businessName: data.businessName.trim().slice(0, 100),
    headline: data.headline.trim().slice(0, 200),
    description: data.description?.trim().slice(0, 400) || '',
    subtext: data.subtext?.trim().slice(0, 200) || '',
    logoUrl: data.logoUrl || '',
    imageUrl: data.imageUrl || '',
    ctaText: data.ctaText?.trim().slice(0, 40) || 'Learn More',
    ctaUrl: data.ctaUrl.trim().slice(0, 500),
    price: Number(data.price) || 0,
    durationDays: Number(data.durationDays) || 30,
    status: 'pending',
    views: 0, clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  try {
    await createNotification({ userId: data.userId, type: 'ad_submitted', title: 'Ad submitted', body: `Your "${data.businessName}" ad is being reviewed.`, link: '/advertise' })
  } catch {}
  return ref.id
}

export async function listMyAdSubmissions(userId) {
  if (!userId) return []
  try {
    const q = query(collection(db, 'adSubmissions'), where('userId', '==', userId))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    return items
  } catch { return [] }
}

export async function listAllAdSubmissions() {
  try {
    const snap = await getDocs(collection(db, 'adSubmissions'))
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    return items
  } catch { return [] }
}

/* ============================================================
   3. ADMIN ACTIONS (This fixes your error!)
   ============================================================ */

export async function updateAdStatus(submissionId, newStatus, adminUid = 'admin') {
  const ref = doc(db, 'adSubmissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Submission not found')

  const s = snap.data()
  const now = new Date()
  const payload = { status: newStatus, reviewedBy: adminUid, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() }

  if (newStatus === 'approved') {
    const expiresAt = new Date(now)
    expiresAt.setDate(expiresAt.getDate() + (s.durationDays || 30))
    payload.startsAt = now
    payload.expiresAt = expiresAt

    if (s.advertisementId) {
      await updateDoc(doc(db, 'advertisements', s.advertisementId), { active: true, expiresAt, updatedAt: serverTimestamp() })
    } else {
      const adRef = await addDoc(collection(db, 'advertisements'), {
        brand: s.businessName, headline: s.headline, description: s.description || '', subtext: s.subtext || '',
        logoUrl: s.logoUrl || '', imageUrl: s.imageUrl || '', url: s.ctaUrl, cta: s.ctaText || 'Learn More',
        active: true, order: 0, source: 'submission', submissionId, ownerId: s.userId, packageId: s.packageId,
        showOnDashboard: !!s.showOnDashboard, views: 0, clicks: 0, startsAt: now, expiresAt,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      payload.advertisementId = adRef.id
    }
    try { await createNotification({ userId: s.userId, type: 'ad_approved', title: '🎉 Ad Live!', body: `"${s.headline}" is live.`, link: '/advertise' }) } catch {}
  } else {
    if (s.advertisementId) {
      await updateDoc(doc(db, 'advertisements', s.advertisementId), { active: false })
    }
    if (newStatus === 'rejected') payload.rejectionReason = 'Banned or Rejected by Admin.'
  }
  await updateDoc(ref, payload)
}

// 👇 THE FUNCTION YOUR ADMIN PAGE IS ASKING FOR 👇
export async function approveAdSubmission(submissionId, adminUid) {
  return await updateAdStatus(submissionId, 'approved', adminUid)
}

export async function rejectAdSubmission(submissionId, adminUid, reason) {
  const ref = doc(db, 'adSubmissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Submission not found')
  const s = snap.data()

  if (s.advertisementId) await updateDoc(doc(db, 'advertisements', s.advertisementId), { active: false })

  await updateDoc(ref, {
    status: 'rejected', rejectionReason: reason?.trim().slice(0, 500) || 'Does not meet guidelines.',
    reviewedBy: adminUid, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  try { await createNotification({ userId: s.userId, type: 'ad_rejected', title: 'Ad rejected', body: reason || 'Check guidelines.', link: '/advertise' }) } catch {}
}

export async function deleteAdSubmission(submissionId, advertisementId) {
  if (advertisementId) { try { await deleteDoc(doc(db, 'advertisements', advertisementId)) } catch {} }
  await deleteDoc(doc(db, 'adSubmissions', submissionId))
}

/* ============================================================
   4. PUBLIC ADS & METRICS
   ============================================================ */

export async function listActiveAds(max = 6) {
  try {
    const q = query(collection(db, 'advertisements'), where('active', '==', true))
    const snap = await getDocs(q)
    const now = Date.now()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((ad) => {
      if (ad.expiresAt) {
        const exp = ad.expiresAt.seconds ? ad.expiresAt.seconds * 1000 : new Date(ad.expiresAt).getTime()
        if (exp < now) return false 
      }
      return true
    })
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return items.slice(0, max)
  } catch { return [] }
}

export async function recordAdView(adId) {
  if (!adId) return
  try { await updateDoc(doc(db, 'advertisements', adId), { views: increment(1) }) } catch {}
}

export async function recordAdClick(adId) {
  if (!adId) return
  try { await updateDoc(doc(db, 'advertisements', adId), { clicks: increment(1) }) } catch {}
}