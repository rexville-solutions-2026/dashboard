import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AdminGate } from '../components/admin/AdminGate'
import { StepTabs } from '../components/admin/StepTabs'
import { Step1SicData } from '../components/admin/Step1SicData'
import { Step2Units } from '../components/admin/Step2Units'
import { LeaderboardEditor } from '../components/admin/LeaderboardEditor'
import { AllBoardsOverview } from '../components/admin/AllBoardsOverview'
import { DailyTrackingBoard } from '../components/admin/DailyTrackingBoard'
import { AdminFooter } from '../components/admin/AdminFooter'
import { fetchFullReportDay, resetDay, saveAndBroadcast, type FullReportDay } from '../lib/api'
import { todayISO } from '../lib/date'
import { ADMIN_SESSION_KEY } from '../lib/constants'
import type { LeaderboardEntry, Role, TrackingInfo, TrackingRow } from '../lib/types'

function AdminPanel() {
  const [reportDate, setReportDate] = useState(todayISO())
  const [data, setData] = useState<FullReportDay | null>(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Admin · Rexville Performance Board'
  }, [])

  useEffect(() => {
    let cancelled = false
    setData(null)
    fetchFullReportDay(reportDate).then((d) => {
      if (!cancelled) setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [reportDate])

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    )
  }

  function updateEntry(boardType: 'top5' | 'bottom5', role: Role, rank: number, patch: Partial<LeaderboardEntry>) {
    setData((prev) => {
      if (!prev) return prev
      const leaderboard = prev.leaderboard.map((e) =>
        e.board_type === boardType && e.role === role && e.rank === rank ? { ...e, ...patch } : e
      )
      return { ...prev, leaderboard }
    })
  }

  function updateTrackingInfo(patch: Partial<TrackingInfo>) {
    setData((prev) => (prev ? { ...prev, trackingInfo: { ...prev.trackingInfo, ...patch } } : prev))
  }

  function updateTrackingRow(hourIndex: number, patch: Partial<TrackingRow>) {
    setData((prev) => {
      if (!prev) return prev
      const trackingRows = prev.trackingRows.map((row) =>
        row.hour_index === hourIndex ? { ...row, ...patch } : row
      )
      return { ...prev, trackingRows }
    })
  }

  async function handleSave() {
    if (!data) return
    setSaving(true)
    setError('')
    try {
      await saveAndBroadcast(data)
      setSavedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Reset all data for this report date? This cannot be undone.')) return
    setSaving(true)
    setError('')
    try {
      await resetDay(reportDate)
      const fresh = await fetchFullReportDay(reportDate)
      setData(fresh)
      setSavedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <div className="top-gradient-bar" />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--panel-2)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-red-400/70 font-display text-lg font-bold text-red-400"
              style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
            >
              F
            </div>
            <div className="font-display text-2xl font-extrabold uppercase tracking-wide">Admin Panel</div>
          </div>
          <Link
            to="/top5"
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-400"
          >
            <ArrowLeft size={16} />
            TV Board
          </Link>
        </header>

        <StepTabs step={step} onStepChange={setStep} />

        {step === 1 && (
          <Step1SicData
            reportDate={reportDate}
            onReportDateChange={setReportDate}
            hourly={data.hourly}
            onHourlyChange={(hourly) => setData((prev) => (prev ? { ...prev, hourly } : prev))}
          />
        )}
        {step === 2 && (
          <Step2Units
            day={data.day}
            onChange={(patch) => setData((prev) => (prev ? { ...prev, day: { ...prev.day, ...patch } } : prev))}
          />
        )}
        {step === 3 && (
          <LeaderboardEditor
            boardType="top5"
            title="Top 5 Board (Board 3)"
            entries={data.leaderboard}
            onEntryChange={(role, rank, patch) => updateEntry('top5', role, rank, patch)}
            bannerMessage={data.day.banner_message}
            onBannerChange={(v) =>
              setData((prev) => (prev ? { ...prev, day: { ...prev.day, banner_message: v } } : prev))
            }
          />
        )}
        {step === 4 && (
          <LeaderboardEditor
            boardType="bottom5"
            title="Bottom 5 Board (Board 4)"
            entries={data.leaderboard}
            onEntryChange={(role, rank, patch) => updateEntry('bottom5', role, rank, patch)}
          />
        )}
        {step === 5 && <AllBoardsOverview initialDate={reportDate} />}
        {step === 6 && (
          <DailyTrackingBoard
            reportDate={reportDate}
            onReportDateChange={setReportDate}
            hourly={data.hourly}
            trackingInfo={data.trackingInfo}
            onTrackingInfoChange={updateTrackingInfo}
            trackingRows={data.trackingRows}
            onTrackingRowChange={updateTrackingRow}
          />
        )}

        <AdminFooter
          saving={saving}
          savedAt={savedAt}
          error={error}
          onReset={handleReset}
          onCancel={() => setStep(1)}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}

export function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === '1')

  if (!unlocked) {
    return <AdminGate onUnlock={() => setUnlocked(true)} />
  }
  return <AdminPanel />
}
