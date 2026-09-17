export function waLink(phone, message = '') {
  if (!phone) return null
  const clean = phone.toString().replace(/[^\d+]/g, '').replace(/^\+/, '')
  if (!clean) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${clean}${text}`
}

export function openWhatsApp(phone, message = '') {
  const url = waLink(phone, message)
  if (!url) return false
  window.open(url, '_blank', 'noopener')
  return true
}