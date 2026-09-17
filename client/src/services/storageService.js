const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_IMAGE_SIZE = 5 * 1024 * 1024    // 5 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024    // 10 MB (Cloudinary free cap)

/**
 * Upload a file to Cloudinary using an unsigned preset.
 * @param {string} folder - path inside Cloudinary, e.g. "avatars/uid123"
 * @param {File} file - the File object
 * @param {'image' | 'raw'} resourceType - 'image' for photos, 'raw' for PDFs/docs
 * @returns {Promise<string>} public secure_url
 */
export async function uploadFile(folder, file, resourceType = 'image') {
  if (!file) throw new Error('No file provided')
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured. Check client/.env.local for VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    )
  }

  const isImage = resourceType === 'image'
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE
  if (file.size > maxSize) {
    const mb = (maxSize / 1024 / 1024).toFixed(0)
    throw new Error(`File too large. Maximum ${mb} MB allowed.`)
  }

  if (isImage && !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed here.')
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(url, { method: 'POST', body: formData })

  if (!res.ok) {
    let message = `Upload failed (${res.status})`
    try {
      const err = await res.json()
      console.error('Cloudinary error:', err)
      message = err?.error?.message || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const data = await res.json()
  return data.secure_url
}

/** Convenience wrappers */
export function uploadImage(folder, file) {
  return uploadFile(folder, file, 'image')
}

export function uploadDocument(folder, file) {
  return uploadFile(folder, file, 'raw')
}