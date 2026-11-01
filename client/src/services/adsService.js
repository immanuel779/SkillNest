import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { createNotification } from './notificationService'

/* ============================================================
   AD PACKAGES — one-time seed
   ============================================================ */

const PACKAGES_DOC = 'adPackages'
const SEEDED_DOC = 'adsPackagesSeeded'

export const DEFAULT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    currency: 'NGN',
    durationDays: 7,
    impressions: '1,000+',
    order: 1,
    features: [
      '7-day campaign',
      'Landing page placement',
      'Logo + headline + CTA',
      'Basic impressions count',
    ],
    highlighted: false,
    active: true,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 15000,
    currency: 'NGN',
    durationDays: 30,
    impressions: '10,000+',
    order: 2,
    features: [
      '30-day campaign',
      'Landing + dashboard placement',
      'Bigger banner (with image)',
      'Click + view metrics',
      'Priority over Starter',
    ],
    highlighted: false,
    active: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50000,
    currency: 'NGN',
    durationDays: 90,
    impressions: '50,000+',
    order: 3,
    features: [
      '90-day campaign',
      'Landing + dashboard + emails',
      'Featured badge on ad',
      'Video / rich media support',
      'Advanced analytics',
      'Priority support',
    ],
    highlighted: true,
    active: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 200000,
    currency: 'NGN',
    durationDays: 365,
    impressions: 'Unlimited',
    order: 4,
    features: [
      '365-day campaign',
      'All placements + newsletters',
      'Custom targeting by state',
      'Multiple ad creatives',
      'Dedicated account manager',
      'Monthly performance report',
    ],
    highlighted: false,
    active: true,
  },
]

export async function listAdPackages() {
  try {
    const snap = await getDocs(collection(db, PACKAGES_DOC))
    if (snap.empty) return DEFAULT_PACKAGES
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return items.filter((p) => p.active !== false)
  } catch {
    return DEFAULT_PACKAGES
  }
}

export async function seedAdPackages() {
  try {
    const seedSnap = await getDoc(doc(db, 'siteConfig', SEEDED_DOC))
    if (seedSnap.exists()) return
    for (const p of DEFAULT_PACKAGES) {
      await setDoc(doc(db, PACKAGES_DOC, p.id), p)
    }
    await setDoc(doc(db, 'siteConfig', SEEDED_DOC), {
      seededAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn('seedAdPackages failed:', err?.message)
  }
}

export async function upsertAdPackage(pkg) {
  const id = pkg.id
  const { id: _, ...rest } = pkg
  await setDoc(doc(db, PACKAGES_DOC, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  })
}

/* ============================================================
   AD SUBMISSIONS — user-facing
   ============================================================ */

export async function submitAd({
  userId,
  userEmail,
  userName,
  businessName,
  headline,
  description,
  subtext,
  logoUrl,
  imageUrl,
  ctaText,
  ctaUrl,
  packageId,
  packageName,
  price,
  currency,
  durationDays,
  showOnDashboard,
}) {
  if (!businessName?.trim() || !headline?.trim() || !ctaUrl?.trim()) {
    throw new Error('Business name, headline, and CTA URL are required')
  }

  const ref = await addDoc(collection(db, 'adSubmissions'), {
    userId,
    userEmail: userEmail || '',
    userName: userName || '',
    businessName: businessName.trim().slice(0, 100),
    headline: headline.trim().slice(0, 200),
    description: description?.trim().slice(0, 400) || '',
    subtext: subtext?.trim().slice(0, 200) || '',
    logoUrl: logoUrl || '',
    imageUrl: imageUrl || '',
    ctaText: ctaText?.trim().slice(0, 40) || 'Learn More',
    ctaUrl: ctaUrl.trim().slice(0, 500),
    packageId,
    packageName,
    price: Number(price) || 0,
    currency: currency || 'NGN',
    durationDays: Number(durationDays) || 30,
    showOnDashboard: !!showOnDashboard,
    status: 'pending',
    views: 0,
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  try {
    await createNotification({
      userId,
      type: 'ad_submitted',
      title: 'Ad submitted for review',
      body: `Your "${businessName}" ad is being reviewed. We'll notify you once it's live.`,
      link: '/advertise',
    })
  } catch {
    /* best-effort */
  }

  return ref.id
}

export async function listMyAdSubmissions(userId) {
  if (!userId) return []
  try {
    const q = query(
      collection(db, 'adSubmissions'),
      where('userId', '==', userId)
    )
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    return items
  } catch {
    return []
  }
}

export async function listAllAdSubmissions() {
  try {
    const snap = await getDocs(collection(db, 'adSubmissions'))
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0
      const tb = b.createdAt?.seconds || 0
      return tb - ta
    })
    return items
  } catch {
    return []
  }
}

export async function approveAdSubmission(submissionId, adminUid) {
  const ref = doc(db, 'adSubmissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Submission not found')

  const s = snap.data()
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + (s.durationDays || 30))

  // Create a live ad
  const adRef = await addDoc(collection(db, 'advertisements'), {
    brand: s.businessName,
    headline: s.headline,
    description: s.description || '',
    subtext: s.subtext || '',
    logoUrl: s.logoUrl || '',
    imageUrl: s.imageUrl || '',
    url: s.ctaUrl,
    cta: s.ctaText || 'Learn More',
    active: true,
    order: 0,
    source: 'submission',
    submissionId,
    ownerId: s.userId,
    packageId: s.packageId,
    showOnDashboard: !!s.showOnDashboard,
    views: 0,
    clicks: 0,
    startsAt: now,
    expiresAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Update the submission
  await updateDoc(ref, {
    status: 'approved',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    advertisementId: adRef.id,
    startsAt: now,
    expiresAt,
    updatedAt: serverTimestamp(),
  })

  // Notify the owner
  try {
    await createNotification({
      userId: s.userId,
      type: 'ad_approved',
      title: '🎉 Your ad is live!',
      body: `"${s.headline}" is now showing on SkillNest.`,
      link: '/advertise',
    })
  } catch {
    /* best-effort */
  }

  return adRef.id
}

export async function rejectAdSubmission(submissionId, adminUid, reason) {
  const ref = doc(db, 'adSubmissions', submissionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Submission not found')

  const s = snap.data()

  await updateDoc(ref, {
    status: 'rejected',
    rejectionReason: reason?.trim().slice(0, 500) || 'Does not meet our guidelines.',
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  try {
    await createNotification({
      userId: s.userId,
      type: 'ad_rejected',
      title: 'Ad needs changes',
      body: reason
        ? `Reason: ${reason.slice(0, 100)}`
        : 'Please review our ad guidelines and resubmit.',
      link: '/advertise',
    })
  } catch {
    /* best-effort */
  }
}

export async function deleteAdSubmission(submissionId) {
  await deleteDoc(doc(db, 'adSubmissions', submissionId))
}

/* ============================================================
   LIVE AD METRICS — increment views / clicks
   ============================================================ */

export async function recordAdView(adId) {
  if (!adId) return
  try {
    await updateDoc(doc(db, 'advertisements', adId), {
      views: increment(1),
    })
  } catch {
    /* silent */
  }
}

export async function recordAdClick(adId) {
  if (!adId) return
  try {
    await updateDoc(doc(db, 'advertisements', adId), {
      clicks: increment(1),
    })
  } catch {
    /* silent */
  }
}