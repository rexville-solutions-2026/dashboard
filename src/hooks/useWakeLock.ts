import { useCallback, useEffect, useRef, useState } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (type: 'release', cb: () => void) => void }

/**
 * Requests a screen wake lock on demand (browsers require a user gesture).
 * Call `requestWakeLock` from a click/tap handler.
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)
  const [held, setHeld] = useState(false)

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
      }
      if (nav.wakeLock) {
        const sentinel = await nav.wakeLock.request('screen')
        sentinelRef.current = sentinel
        setHeld(true)
        sentinel.addEventListener?.('release', () => {
          sentinelRef.current = null
          setHeld(false)
        })
      }
    } catch {
      // Wake lock isn't available/allowed here — fail silently, it's a nice-to-have.
    }
  }, [])

  // The OS/browser silently drops the lock whenever the page is hidden
  // (screen lock, display sleep, tab switch) and never restores it on its
  // own — retry as soon as the screen is visible again.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [requestWakeLock])

  return { requestWakeLock, held }
}
