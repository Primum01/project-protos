import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'

// Handle Vite dynamic import chunk preload failures (stale deployment / network glitch)
window.addEventListener('vite:preloadError', (event) => {
  const PRELOAD_KEY = 'ts_vite_preload_retry'
  const lastRetry = sessionStorage.getItem(PRELOAD_KEY)
  const now = Date.now()

  // Prevent infinite reload loop: allow maximum 1 automatic reload per 15 seconds
  if (!lastRetry || now - parseInt(lastRetry, 10) > 15000) {
    sessionStorage.setItem(PRELOAD_KEY, String(now))
    console.warn('[Vite] Dynamic import chunk preload failed. Performing controlled reload...', event)
    window.location.reload()
  } else {
    console.error('[Vite] Repeated chunk preload failure detected. Aborting reload loop to prevent freezing.', event)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
