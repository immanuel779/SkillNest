import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { notifyAdmins } from '../services/notificationService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [suspendedNotice, setSuspendedNotice] = useState(false)

  // Watch Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser)
      if (!fbUser) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  // Real-time listener on the current user's profile.
  // If they get suspended while logged in, we sign them out immediately.
  useEffect(() => {
    if (!user) return

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      async (snap) => {
        if (!snap.exists()) {
          setProfile(null)
          setLoading(false)
          return
        }
        const data = snap.data()

        if (data.isSuspended === true) {
          // Flag the reason so the login page can display it
          setSuspendedNotice(true)
          try {
            await signOut(auth)
          } catch {
            /* ignore */
          }
          setProfile(null)
          return
        }

        setProfile(data)
        setLoading(false)
      },
      (err) => {
        console.warn('Profile listener error:', err)
        setLoading(false)
      }
    )

    return unsub
  }, [user])

  const register = async ({ fullName, email, password, role }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await fbUpdateProfile(cred.user, { displayName: fullName })
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      fullName,
      role,
      isSuspended: false,
      createdAt: serverTimestamp(),
    })
    setProfile({
      uid: cred.user.uid,
      email,
      fullName,
      role,
      isSuspended: false,
    })

    try {
      await notifyAdmins({
        type: 'admin_new_user',
        title: '👤 New user registered',
        body: `${fullName || email} signed up as ${role.replace('_', ' ')}.`,
        link: '/admin/users',
      })
    } catch {
      /* best-effort */
    }

    return cred.user
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  const refreshProfile = async () => {
    if (!user) return null
    const snap = await getDoc(doc(db, 'users', user.uid))
    const data = snap.exists() ? snap.data() : null
    setProfile(data)
    return data
  }

  const clearSuspendedNotice = useCallback(() => {
    setSuspendedNotice(false)
  }, [])

  const value = {
    user,
    profile,
    loading,
    suspendedNotice,
    clearSuspendedNotice,
    register,
    login,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}