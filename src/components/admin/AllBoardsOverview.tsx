import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import Papa from 'papaparse'
import { fetchLeaderboardEntries, fetchLeaderboardEntriesRange } from '../../lib/api'
import { todayISO } from '../../lib/date'
import type { BoardType, LeaderboardEntry, Role } from '../../lib/types'

type ViewMode = 'day' | 'month'

const SECTIONS: { boardType: BoardType; role: Role; title: string; accent: 'red' | 'cyan' }[] = [
  { boardType: 'top5', role: 'picker', title: 'Top 5 Pickers', accent: 'red' },
  { boardType: 'top5', role: 'packer', title: 'Top 5 Packers', accent: 'cyan' },
  { boardType: 'bottom5', role: 'picker', title: 'Bottom 5 Pickers', accent: 'red' },
  { boardType: 'bottom5', role: 'packer', title: 'Bottom 5 Packers', accent: 'cyan' },
]

function boardLabel(b: BoardType) {
  return b === 'top5' ? 'Top 5' : 'Bottom 5'
}
function roleLabel(r: Role) {
  return r === 'picker' ? 'Picker' : 'Packer'
}

/** "2026-09" -> { start: '2026-09-01', end: '2026-09-30' } */
function monthRange(monthValue: string): { start: string; end: string } {
  const [y, m] = monthValue.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { start: `${monthValue}-01`, end: `${monthValue}-${String(lastDay).padStart(2, '0')}` }
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

/**
 * Read-only "all four sections at once" view of the leaderboard, with its
 * own date/month picker (independent of the report date the rest of the
 * Admin panel is editing) and a CSV export of exactly what's on screen.
 * Day mode shows one day's Top 5 / Bottom 5. Month mode shows every day's
 * boards for the chosen month, so you can see how names/numbers moved
 * across the month, and export all of it at once.
 */
export function AllBoardsOverview({ initialDate }: { initialDate: string }) {
  const [mode, setMode] = useState<ViewMode>('day')
  const [dayValue, setDayValue] = useState(initialDate)
  const [monthValue, setMonthValue] = useState(initialDate.slice(0, 7))
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setEntries(null)
    setError('')
    const request =
      mode === 'day'
        ? fetchLeaderboardEntries(dayValue)
        : (() => {
            const { start, end } = monthRange(monthValue)
            return fetchLeaderboardEntriesRange(start, end)
          })()
    request
      .then((rows) => {
        if (!cancelled) setEntries(rows)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load that period.')
      })
    return () => {
      cancelled = true
    }
  }, [mode, dayValue, monthValue])

  const sectionRows = useMemo(() => {
    const withEntries = (entries ?? []).filter((e) => (e.employee_name ?? '').trim() !== '')
    const byKey = new Map<string, LeaderboardEntry[]>()
    for (const s of SECTIONS) byKey.set(`${s.boardType}-${s.role}`, [])
    for (const e of withEntries) {
      const key = `${e.board_type}-${e.role}`
      byKey.get(key)?.push(e)
    }
    for (const rows of byKey.values()) {
      rows.sort((a, b) => (a.report_date !== b.report_date ? (a.report_date < b.report_date ? -1 : 1) : a.rank - b.rank))
    }
    return byKey
  }, [entries])

  const hasAnyData = (entries ?? []).some((e) => (e.employee_name ?? '').trim() !== '')

  function handleExportCsv() {
    if (!entries) return
    const rows = entries
      .filter((e) => (e.employee_name ?? '').trim() !== '')
      .sort((a, b) => {
        if (a.report_date !== b.report_date) return a.report_date < b.report_date ? -1 : 1
        if (a.board_type !== b.board_type) return a.board_type === 'top5' ? -1 : 1
        if (a.role !== b.role) return a.role === 'picker' ? -1 : 1
        return a.rank - b.rank
      })
      .map((e) => ({
        Date: e.report_date,
        Board: boardLabel(e.board_type),
        Role: roleLabel(e.role),
        Rank: e.rank,
        Name: e.employee_name,
        Units: e.units ?? '',
      }))

    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'day' ? `leaderboards-${dayValue}.csv` : `leaderboards-${monthValue}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
        <div>
          <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">All Boards</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-white/10 bg-[var(--panel)] p-1">
            {(['day', 'month'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide transition ${
                  mode === m ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'day' ? 'Day' : 'Month'}
              </button>
            ))}
          </div>

          {mode === 'day' ? (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Date:</label>
              <input
                type="date"
                value={dayValue}
                max={todayISO()}
                onChange={(e) => setDayValue(e.target.value)}
                className="rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Month:</label>
              <input
                type="month"
                value={monthValue}
                max={todayISO().slice(0, 7)}
                onChange={(e) => setMonthValue(e.target.value)}
                className="rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!hasAnyData}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {!entries && !error ? (
        <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-8 text-center text-slate-500">
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SECTIONS.map(({ boardType, role, title, accent }) => {
            const rows = sectionRows.get(`${boardType}-${role}`) ?? []
            return (
              <div
                key={`${boardType}-${role}`}
                className={`rounded-2xl border p-4 ${accent === 'red' ? 'border-red-500/40' : 'border-cyan-400/40'}`}
              >
                <h4
                  className={`font-display text-base font-extrabold uppercase tracking-wide ${
                    accent === 'red' ? 'text-red-400' : 'text-cyan-300'
                  }`}
                >
                  {title}
                </h4>
                <div className="mt-3 flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                  {rows.length === 0 ? (
                    <p className="text-sm text-slate-500">No data for this {mode === 'day' ? 'date' : 'month'}.</p>
                  ) : (
                    rows.map((e) => (
                      <div
                        key={`${e.report_date}-${e.rank}`}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-[var(--panel)] px-3 py-2"
                      >
                        {mode === 'month' && (
                          <span className="w-11 shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                            {formatShortDate(e.report_date)}
                          </span>
                        )}
                        <span className="w-5 shrink-0 font-display text-sm font-bold text-slate-500">{e.rank}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{e.employee_name}</span>
                        <span className="shrink-0 text-sm tabular-nums text-slate-300">{e.units ?? '—'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
