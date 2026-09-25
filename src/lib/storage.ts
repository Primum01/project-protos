/**
 * Centralized Client-Side Storage Hardening & Sanitization
 * Enforces privacy, prevents PII leakage to disk, and purges admin caches on logout.
 */

export const ADMIN_DATA_CACHE_KEYS = [
  'ts_admin_listings_cache',
  'ts_admin_messages_cache',
  'ts_admin_invoices_cache',
  'ts_admin_receipts_cache',
  'ts_admin_analytics_metrics_v1',
] as const

export const ADMIN_SESSION_KEYS = [
  'ts_session_id',
  'ts_session_user',
  'ts_session_started',
  'ts_session_last_activity',
] as const

export const ALL_ADMIN_KEYS = [
  ...ADMIN_DATA_CACHE_KEYS,
  ...ADMIN_SESSION_KEYS,
] as const

/**
 * Purges sensitive data caches from localStorage and sessionStorage.
 * Safe to call whenever unauthenticated without disrupting in-progress session identity.
 */
export function clearAdminCaches(): void {
  try {
    for (const key of ADMIN_DATA_CACHE_KEYS) {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore storage access restrictions */
  }
}

/**
 * Purges admin operator session keys (session ID, user, timestamp).
 * Called on explicit logout, remote session eviction, or idle timeout.
 */
export function clearAdminSessionStorage(): void {
  try {
    for (const key of ADMIN_SESSION_KEYS) {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore storage access restrictions */
  }
}

/**
 * Purges all admin-related data: both caches and session identifiers.
 * Called on sign-out, session eviction, and idle timeout.
 */
export function clearAdminStorage(): void {
  clearAdminCaches()
  clearAdminSessionStorage()
}

/**
 * Ephemeral session storage helper (scoped to active browser tab only).
 * Never persists to disk or survives browser tab closure.
 */
export const tabStorage = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      /* ignore */
    }
  },
  remove(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}
