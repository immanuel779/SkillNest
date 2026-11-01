import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/* ============================================================
   SITE CONFIG
   ============================================================ */

const DEFAULT_CONFIG = {
  footerAbout: "SkillNest is Nigeria's trusted job platform — find verified job vacancies across Lagos, Abuja, Port Harcourt and all 36 states. Free ATS CV builder, free daily job alerts, and instant one-click apply.",
  footerSocials: {
    facebook: '#',
    twitter: '#',
    linkedin: '#',
    instagram: '#',
    youtube: '#',
    tiktok: '#'
  },
  footerTags: ['Remote Jobs', 'NGO Jobs', 'Graduate Trainee', 'Entry Level']
}

export async function getLandingConfig() {
  try {
    const snap = await getDoc(doc(db, 'siteConfig', 'landingConfig'))
    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() }
    }
  } catch (err) {
    console.warn('Failed to fetch landing config. Using fallback.', err.message)
  }
  return DEFAULT_CONFIG
}

export async function updateLandingConfig(patch) {
  try {
    await setDoc(doc(db, 'siteConfig', 'landingConfig'), patch, { merge: true })
    return true
  } catch (err) {
    console.error('Failed to update landing config:', err)
    return false
  }
}

/* ============================================================
   ADS
   ============================================================ */

export async function listActiveAds(max = 6) {
  try {
    const q = query(
      collection(db, 'advertisements'),
      where('active', '==', true)
    )
    const snap = await getDocs(q)
    const now = Date.now()

    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((ad) => {
        // Skip expired ads
        if (ad.expiresAt) {
          const exp = ad.expiresAt.seconds
            ? ad.expiresAt.seconds * 1000
            : new Date(ad.expiresAt).getTime()
          if (exp < now) return false
        }
        return true
      })

    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return items.slice(0, max)
  } catch (err) {
    console.warn('listActiveAds failed:', err?.message)
    return []
  }
}

export async function listAllAds() {
  try {
    const snap = await getDocs(collection(db, 'advertisements'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('listAllAds failed:', err?.message)
    return []
  }
}

export async function createAd(data) {
  const ref = await addDoc(collection(db, 'advertisements'), {
    ...data,
    active: data.active !== false,
    order: data.order ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAd(adId, patch) {
  await updateDoc(doc(db, 'advertisements', adId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAd(adId) {
  await deleteDoc(doc(db, 'advertisements', adId))
}

/* ============================================================
   BLOG POSTS
   ============================================================ */

export async function listPublishedBlogPosts(max = 12) {
  try {
    const q = query(
      collection(db, 'blogPosts'),
      where('published', '==', true)
    )
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    
    // Sort by publish date (newest first)
    items.sort((a, b) => {
      const ta = a.publishedAt?.seconds || 0
      const tb = b.publishedAt?.seconds || 0
      return tb - ta
    })
    return items.slice(0, max)
  } catch (err) {
    console.warn('listPublishedBlogPosts failed:', err?.message)
    return []
  }
}

export async function listAllBlogPosts() {
  try {
    const snap = await getDocs(collection(db, 'blogPosts'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('listAllBlogPosts failed:', err?.message)
    return []
  }
}

export async function getBlogPost(postId) {
  try {
    const snap = await getDoc(doc(db, 'blogPosts', postId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (err) {
    console.warn('getBlogPost failed:', err?.message)
    return null
  }
}

export async function createBlogPost(data) {
  const slug = (data.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)

  const ref = await addDoc(collection(db, 'blogPosts'), {
    ...data,
    slug,
    published: data.published !== false,
    publishedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBlogPost(postId, patch) {
  await updateDoc(doc(db, 'blogPosts', postId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteBlogPost(postId) {
  await deleteDoc(doc(db, 'blogPosts', postId))
}