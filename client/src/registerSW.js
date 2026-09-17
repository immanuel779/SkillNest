// Optional — enables install prompt on Android and offline support later.
// Skip this for now if you're not sure — the manifest alone handles the icon.
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err))
  }
}