import { useEffect, useState } from 'react'
import { BoardHeader } from '../components/tv/BoardHeader'
import { TopFiveView } from '../components/tv/TopFiveView'
import { BottomFiveView } from '../components/tv/BottomFiveView'
import { PerformanceView } from '../components/tv/PerformanceView'
import { OperationsView } from '../components/tv/OperationsView'
import { DailyTrackingView } from '../components/tv/DailyTrackingView'
import { useReportDay } from '../hooks/useReportDay'
import { useWakeLock } from '../hooks/useWakeLock'
import { todayISO } from '../lib/date'

const VIEWS = ['top5', 'bottom5', 'performance', 'ops', 'tracking'] as const
type View = (typeof VIEWS)[number]

const ROTATE_MS = 15_000

const VIEW_META: Record<View, { title: string; footerLabel: string; rows: string; gap: string }> = {
  top5: {
    title: 'Rexville Live Warehouse Dashboard',
    footerLabel: 'Rexville · Top 5 · Rotating every 15s',
    rows: '168px auto 1fr 32px',
    gap: 'gap-4',
  },
  bottom5: {
    title: 'Rexville Live Warehouse Dashboard',
    footerLabel: 'Rexville · Focus 5 · Rotating every 15s',
    rows: '168px auto 1fr 32px',
    gap: 'gap-4',
  },
  performance: {
    title: 'Rexville Live Warehouse Dashboard',
    footerLabel: 'Rexville · Live · Auto-refresh 15s',
    rows: '168px 1fr 32px',
    gap: 'gap-5',
  },
  ops: {
    title: 'Rexville Live Warehouse Dashboard',
    footerLabel: 'Rexville · Operations · Rotating every 15s',
    rows: '168px 1fr 32px',
    gap: 'gap-5',
  },
  tracking: {
    title: 'Rexville Live Warehouse Dashboard',
    footerLabel: 'Rexville · Daily Tracking · Rotating every 15s',
    // No header row here on purpose — the tracking grid has 24 rows of its
    // own to fit, so the logo/clock/admin bar is dropped for this slide to
    // free up the height it needs for legible text.
    rows: '1fr 32px',
    gap: 'gap-5',
  },
}

/**
 * The public TV board. Mirrors the original site's behaviour exactly: a
 * single full-bleed screen (no scrolling — everything is sized in vh/clamp
 * to fit whatever display it's on) that auto-rotates every 15s through five
 * views — Top 5, Bottom 5 ("Focus 5"), a live Performance board, an
 * Operations board, and the Daily Tracking board — rather than separate pages.
 */
export function TvBoard() {
  const reportDate = todayISO()
  const { day, hourly, leaderboard, trackingInfo, trackingRows, loading } = useReportDay(reportDate)
  const { requestWakeLock, held } = useWakeLock()
  const [viewIndex, setViewIndex] = useState(0)
  const [showWakeHint, setShowWakeHint] = useState(false)
  const view = VIEWS[viewIndex]
  const meta = VIEW_META[view]

  useEffect(() => {
    const id = setInterval(() => {
      setViewIndex((i) => (i + 1) % VIEWS.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  // Belt-and-braces for an always-on shop-floor screen: a full reload every
  // few hours clears out any accumulated state and forces a clean
  // reconnect, so nothing can wander off and stay stuck between the times
  // someone happens to walk past and notice.
  useEffect(() => {
    const id = setInterval(() => window.location.reload(), 4 * 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    document.title = meta.title
  }, [meta.title])

  useEffect(() => {
    const t = setTimeout(() => setShowWakeHint(true), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <div
        // Remounting on view change replays every entrance animation (page
        // blur-in, header/panel stagger, banner pop, progress bar) exactly
        // like a fresh page load on the original site.
        key={view}
        className={`tv-bg page-enter grid w-screen overflow-hidden ${meta.gap} p-6`}
        style={{ height: '100dvh', gridTemplateRows: meta.rows }}
        onClick={requestWakeLock}
      >
        {view !== 'tracking' && <BoardHeader />}

        {loading ? (
          <div className="flex min-h-0 items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : view === 'top5' ? (
          <TopFiveView day={day} leaderboard={leaderboard} />
        ) : view === 'bottom5' ? (
          <BottomFiveView leaderboard={leaderboard} />
        ) : view === 'performance' ? (
          <PerformanceView hourly={hourly} />
        ) : view === 'ops' ? (
          <OperationsView day={day} />
        ) : (
          <DailyTrackingView hourly={hourly} trackingInfo={trackingInfo} trackingRows={trackingRows} />
        )}

        <footer
          className="relative flex items-center justify-between px-2 text-sm font-bold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          <span>{meta.footerLabel}</span>
          <div className="absolute -top-2 right-0 left-0 h-[3px] overflow-hidden rounded-full bg-white/5">
            <div className="rotate-progress" />
          </div>
        </footer>
      </div>

      {showWakeHint && !held && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs tracking-widest text-white/80 uppercase backdrop-blur">
          Tap anywhere to keep screen awake
        </div>
      )}
    </>
  )
}
