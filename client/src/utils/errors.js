/**
 * Turn any error into a user-friendly message.
 * Falls back to the original message if we don't recognize it.
 *
 * Use: setError(friendlyError(err))
 */
export function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.'

  const raw = (err.message || err.code || String(err)).toLowerCase()

  // ===========================
  // Firestore permissions / rules
  // ===========================
  if (
    raw.includes('missing or insufficient permissions') ||
    raw.includes('permission-denied')
  ) {
    return "You don't have permission to do that. If this seems wrong, refresh the page or contact support."
  }

  // ===========================
  // Authentication
  // ===========================
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/invalid-login-credentials')
  ) {
    return 'Incorrect email or password.'
  }
  if (raw.includes('auth/user-not-found')) {
    return 'No account found with that email.'
  }
  if (raw.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support for help.'
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with that email already exists.'
  }
  if (raw.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters.'
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (raw.includes('auth/missing-email')) {
    return 'Please enter your email address.'
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }
  if (raw.includes('auth/network-request-failed')) {
    return 'Network error. Check your internet connection and try again.'
  }
  if (raw.includes('auth/requires-recent-login')) {
    return 'Please sign out and sign back in to complete this action.'
  }
  if (raw.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled. Contact support.'
  }

  // ===========================
  // Firestore queries / indexes
  // ===========================
  if (
    raw.includes('failed-precondition') ||
    raw.includes('requires an index') ||
    raw.includes('the query requires an index')
  ) {
    return 'This view needs a bit more setup. Please try again in a moment.'
  }
  if (raw.includes('not-found') || raw.includes('no document to update')) {
    return "We couldn't find what you were looking for."
  }
  if (raw.includes('already-exists')) {
    return 'That item already exists.'
  }
  if (raw.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again.'
  }
  if (raw.includes('deadline-exceeded')) {
    return 'The request took too long. Please try again.'
  }
  if (raw.includes('resource-exhausted')) {
    return 'Too many requests right now. Please slow down and try again.'
  }
  if (raw.includes('aborted')) {
    return 'The request was interrupted. Please try again.'
  }
  if (raw.includes('cancelled')) {
    return 'The request was cancelled.'
  }
  if (raw.includes('data-loss')) {
    return 'Something went wrong saving your data. Please try again.'
  }

  // ===========================
  // File uploads
  // ===========================
  if (raw.includes('file too large')) {
    return err.message || 'That file is too large. Please choose a smaller one.'
  }
  if (raw.includes('only image files')) {
    return 'Please select a valid image file (PNG or JPG).'
  }
  if (raw.includes('cloudinary is not configured')) {
    return 'File uploads are not set up. Please contact support.'
  }
  if (raw.includes('upload failed')) {
    return 'File upload failed. Please check your connection and try again.'
  }
  if (raw.includes('imagekit is not configured')) {
    return 'File uploads are not set up. Please contact support.'
  }

  // ===========================
  // Network
  // ===========================
  if (
    raw.includes('network') ||
    raw.includes('fetch failed') ||
    raw.includes('failed to fetch')
  ) {
    return 'Network error. Check your internet connection and try again.'
  }

  // ===========================
  // Fallback
  // ===========================
  return err.message || 'Something went wrong. Please try again.'
}

/**
 * True when the error is a Firestore permission issue.
 * Use this to silently swallow access errors in optional lookups —
 * for example, "have I saved this job?" or "have I applied?".
 */
export function isPermissionError(err) {
  if (!err) return false
  const raw = (err.message || err.code || String(err)).toLowerCase()
  return (
    raw.includes('missing or insufficient permissions') ||
    raw.includes('permission-denied')
  )
}

/**
 * Log a friendly message to the console while keeping the raw error
 * visible for debugging. Handy when you want dev noise but clean UI.
 */
export function reportError(err, context = '') {
  if (context) console.warn(`[${context}]`, err)
  else console.warn(err)
  return friendlyError(err)
}