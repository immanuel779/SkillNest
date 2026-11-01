import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path if needed

// Helper to chunk arrays for Firestore's 500-write limit
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// ==========================================
// 1. Single User Notification
// ==========================================
export async function createNotification({
  userId,
  type = 'system',
  title,
  body,
  link = '',
}) {
  if (!userId || !title) return null;
  try {
    const ref = await addDoc(collection(db, 'notifications'), {
      userUid: userId, // 🚀 Aligned with backend
      type,
      title,
      body: body || '',
      link,
      read: false,     // 🚀 Aligned with backend
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.warn('[notifications] createNotification failed:', err?.message);
    return null;
  }
}

// ==========================================
// 2. Notify Admins
// ==========================================
export async function notifyAdmins({ type, title, body, link = '' }) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snap = await getDocs(q);
    const admins = snap.docs.map((d) => d.id);
    if (admins.length === 0) return 0;

    const batch = writeBatch(db);
    admins.forEach((uid) => {
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userUid: uid,
        type,
        title,
        body,
        link,
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    return admins.length;
  } catch (err) {
    console.warn('[notifications] notifyAdmins failed:', err?.message);
    return 0;
  }
}

// ==========================================
// 3. Notify Company Followers
// ==========================================
export async function notifyCompanyFollowers(
  companyId,
  { type = 'company_update', title, body, link = '' }
) {
  if (!companyId || !title) return 0;
  try {
    const q = query(collection(db, 'companyFollowers'), where('companyId', '==', companyId));
    const snap = await getDocs(q);
    const followerIds = snap.docs.map((d) => d.data().userUid).filter(Boolean);
    if (followerIds.length === 0) return 0;

    const chunks = chunkArray(followerIds, 500);
    let sent = 0;

    for (const slice of chunks) {
      const batch = writeBatch(db);
      slice.forEach((uid) => {
        const ref = doc(collection(db, 'notifications'));
        batch.set(ref, {
          userUid: uid,
          type,
          title,
          body,
          link,
          read: false,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      sent += slice.length;
    }
    return sent;
  } catch (err) {
    console.warn('[notifications] notifyCompanyFollowers failed:', err?.message);
    return 0;
  }
}

// ==========================================
// 4. Platform Broadcast (Admin)
// ==========================================
export async function notifyAllUsers({
  title,
  body,
  link = '',
  type = 'platform_announcement',
  role = null,
}) {
  if (!title?.trim() || !body?.trim()) {
    throw new Error('Title and body are required');
  }

  const usersRef = collection(db, 'users');
  const q = role ? query(usersRef, where('role', '==', role)) : usersRef;
  const snap = await getDocs(q);
  const userIds = snap.docs.map((d) => d.id);
  
  if (userIds.length === 0) return { sent: 0 };

  const chunks = chunkArray(userIds, 500);
  let sent = 0;

  for (const slice of chunks) {
    const batch = writeBatch(db);
    slice.forEach((uid) => {
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userUid: uid,
        type,
        title: title.trim(),
        body: body.trim(),
        link,
        read: false,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    sent += slice.length;
  }
  return { sent };
}

// ==========================================
// 5. Real-time Subscriptions & Reads
// ==========================================

export function subscribeNotifications(uid, callback) {
  if (!uid) return () => {};

  // Bypass missing index by using limit() instead of orderBy()
  const q = query(
    collection(db, 'notifications'),
    where('userUid', '==', uid),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Sort in memory
    items.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    });
    
    callback(items);
  }, (error) => {
    console.error('[notifications] snapshot error:', error);
  });
}

export async function markNotificationRead(id) {
  if (!id) return;
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (err) {
    console.warn('[notifications] mark read failed:', err?.message);
  }
}

export async function markAllNotificationsRead(uid) {
  if (!uid) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userUid', '==', uid),
      where('read', '==', false),
      limit(500)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const chunks = chunkArray(snap.docs, 500);
    for (const slice of chunks) {
      const batch = writeBatch(db);
      slice.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    }
  } catch (err) {
    console.warn('[notifications] markAllRead failed:', err?.message);
  }
}

// ==========================================
// 6. Deletions
// ==========================================

export async function deleteNotification(id) {
  if (!id) return;
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    console.warn('[notifications] deleteNotification failed:', err?.message);
  }
}

export async function deleteAllNotifications(uid) {
  if (!uid) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userUid', '==', uid),
      limit(500)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const chunks = chunkArray(snap.docs, 500);
    for (const slice of chunks) {
      const batch = writeBatch(db);
      slice.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.warn('[notifications] deleteAll failed:', err?.message);
  }
}

// ==========================================
// 7. Unread Count (For the Bell Icon)
// ==========================================

export function subscribeUnreadNotificationCount(uid, callback) {
  if (!uid) {
    callback(0);
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('userUid', '==', uid),
    where('read', '==', false)
  );

  return onSnapshot(q, (snap) => callback(snap.size), (error) => {
    console.error('[notifications] unread count error:', error);
  });
}