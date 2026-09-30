import { Fragment } from 'react'
import { computeRate } from '../../lib/upmh'
import type { HourlyRow, TrackingInfo, TrackingRow } from '../../lib/types'

// Matches the shift's actual tracking window: starts at 10-11, wraps
// through midnight, and ends at 01-02 — same as the admin editor's board.
const TRACKING_HOURS: string[] = Array.from({ length: 16 }, (_, i) => {
  const pad = (h: number) => h.toString().padStart(2, '0')
  const start = (10 + i) % 24
  const end = (11 + i) % 24
  return `${pad(start)}-${pad(end)}`
})

// The Outbound SIC Data step's 24 hourly rows start at 06:00 (hour_index 0
// = "06:00-07:00"), while this board's rolling day starts at 10-11. Row j
// here lines up with SIC hour_index (j + 4) % 24.
const SIC_HOUR_OFFSET = 4

function sicRowFor(hourly: HourlyRow[], trackingRowIndex: number): HourlyRow | undefined {
  return hourly[(trackingRowIndex + SIC_HOUR_OFFSET) % 24]
}

const PACK_UPH_TARGET = 135
const PICK_UPH_TARGET = 210
const REBIN_UPH_TARGET = 350

/** Parses a manually-typed UPH cell (Rebin's is free text) for the below-target check. */
function parseUph(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

const ACCENT = {
  cyan: { bg: 'bg-cyan-500/90', text: 'text-cyan-300' },
  red: { bg: 'bg-red-500/90', text: 'text-red-400' },
  amber: { bg: 'bg-amber-500/90', text: 'text-amber-300' },
  slate: { bg: 'bg-slate-600/90', text: 'text-slate-300' },
} as const
type Accent = keyof typeof ACCENT

function GroupHeader({ title, accent, span, target }: { title: string; accent: Accent; span: number; target?: string }) {
  return (
    <div
      style={{ gridColumn: `span ${span}` }}
      className={`flex items-center justify-center gap-2 border border-white/10 px-1 font-display font-extrabold text-white uppercase tracking-wide ${ACCENT[accent].bg}`}
    >
      <span style={{ fontSize: 'clamp(19px, 3vh, 38px)' }}>{title}</span>
      {target !== undefined && (
        <span
          className="rounded bg-black/25 px-2 py-1 font-semibold normal-case text-white/80"
          style={{ fontSize: 'clamp(13px, 1.8vh, 22px)' }}
        >
          Target {target}
        </span>
      )}
    </div>
  )
}

function SubHeader({ label, accent }: { label: string; accent: Accent }) {
  return (
    <div
      className={`flex items-center justify-center border border-white/10 bg-[var(--bg-panel)] px-1 text-center leading-tight font-bold uppercase tracking-wide ${ACCENT[accent].text}`}
      style={{ fontSize: 'clamp(15px, 2.2vh, 27px)' }}
    >
      {label}
    </div>
  )
}

function Cell({ value, danger }: { value: string | number | null | undefined; danger?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border border-white/10 bg-[var(--bg-panel)] tabular-nums ${
        danger ? 'font-extrabold text-red-500' : 'text-slate-100'
      }`}
      style={{ fontSize: 'clamp(18px, 2.9vh, 36px)' }}
    >
      {value === null || value === undefined || value === '' ? '—' : value}
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="shrink-0 font-bold tracking-widest text-slate-500 uppercase"
        style={{ fontSize: 'clamp(14px, 1.9vh, 24px)' }}
      >
        {label}:
      </span>
      <span className="font-bold text-slate-100" style={{ fontSize: 'clamp(17px, 2.5vh, 31px)' }}>
        {value || '—'}
      </span>
    </div>
  )
}

/**
 * Read-only, full-bleed TV rendition of the Admin panel's Daily Tracking
 * board — the digital replica of the shop-floor whiteboard. Uses CSS Grid
 * (rather than an HTML table) so the 16 hourly rows can flex to fill
 * whatever vertical space the rotation slot gives it with no scrollbar,
 * matching every other view on this board.
 */
export function DailyTrackingView({
  hourly,
  trackingInfo,
  trackingRows,
}: {
  hourly: HourlyRow[]
  trackingInfo: TrackingInfo
  trackingRows: TrackingRow[]
}) {
  const rowByIndex = new Map(trackingRows.map((r) => [r.hour_index, r]))

  return (
    <section className="grid min-h-0 gap-3" style={{ gridTemplateRows: 'auto 1fr' }}>
      <div className="panel stagger-in flex flex-wrap items-center justify-between gap-4 px-6 py-2.5">
        <span
          className="font-display font-extrabold text-white uppercase tracking-wide"
          style={{ fontSize: 'clamp(21px, 3.1vh, 38px)' }}
        >
          Daily Tracking
        </span>
        <div className="flex flex-wrap items-center gap-6">
          <InfoField label="Owner AM" value={trackingInfo.owner_am} />
          <InfoField label="Owner PM" value={trackingInfo.owner_pm} />
          <InfoField label="Target AM" value={trackingInfo.target_am} />
          <InfoField label="Target PM" value={trackingInfo.target_pm} />
        </div>
      </div>

      <div
        className="grid min-h-0 overflow-hidden rounded-2xl border border-white/10"
        style={{
          gridTemplateColumns: '7fr repeat(10, 6.5fr) 10fr 10fr',
          // minmax(0, 1fr) — not bare 1fr — so the data rows are forced to
          // share the leftover space evenly and can never grow past it; bare
          // 1fr rows would let an "auto" content minimum push the grid taller
          // than its container, which is exactly what causes a scrollbar.
          gridTemplateRows: 'auto auto repeat(16, minmax(0, 1fr))',
        }}
      >
        <div
          style={{ gridRow: 'span 2' }}
          className="flex items-center justify-center border border-white/10 bg-slate-700/90 font-display font-extrabold text-white uppercase tracking-wide"
        >
          <span style={{ fontSize: 'clamp(16px, 2.4vh, 30px)' }}>Hour</span>
        </div>
        <GroupHeader title="Pack" accent="cyan" span={4} target={String(PACK_UPH_TARGET)} />
        <GroupHeader title="Pick" accent="red" span={3} target={String(PICK_UPH_TARGET)} />
        <GroupHeader title="Rebin" accent="amber" span={3} target={String(REBIN_UPH_TARGET)} />
        <GroupHeader title="Total" accent="slate" span={2} />

        <SubHeader label="Ops" accent="cyan" />
        <SubHeader label="Spiders" accent="cyan" />
        <SubHeader label="Units" accent="cyan" />
        <SubHeader label="UPH" accent="cyan" />

        <SubHeader label="Ops" accent="red" />
        <SubHeader label="Units" accent="red" />
        <SubHeader label="UPH" accent="red" />

        <SubHeader label="Ops" accent="amber" />
        <SubHeader label="Units" accent="amber" />
        <SubHeader label="UPH" accent="amber" />

        <SubHeader label="Admin+TL" accent="slate" />
        <SubHeader label="Prod. Hrs" accent="slate" />

        {TRACKING_HOURS.map((slot, i) => {
          const row = rowByIndex.get(i)
          const sic = sicRowFor(hourly, i)
          const packOps = sic?.pack_hours ?? null
          const pickOps = sic?.pick_hours ?? null
          const pickUnits = sic?.pick_units ?? null
          const packUnits = sic?.pack_units ?? null
          const pickUph = computeRate(sic?.pick_units, sic?.pick_hours)
          const packUph = computeRate(sic?.pack_units, sic?.pack_hours)
          const rebinUph = parseUph(row?.rebin_uph)
          return (
            <Fragment key={slot}>
              <div
                className="flex items-center justify-center border border-white/10 bg-slate-700/40 font-display font-bold text-slate-200"
                style={{ fontSize: 'clamp(17px, 2.6vh, 32px)' }}
              >
                {slot}
              </div>
              <Cell value={packOps} />
              <Cell value={row?.spiders} />
              <Cell value={packUnits} />
              <Cell value={packUph} danger={packUph !== null && packUph < PACK_UPH_TARGET} />

              <Cell value={pickOps} />
              <Cell value={pickUnits} />
              <Cell value={pickUph} danger={pickUph !== null && pickUph < PICK_UPH_TARGET} />

              <Cell value={row?.rebin_ops} />
              <Cell value={row?.rebin_units} />
              <Cell value={row?.rebin_uph} danger={rebinUph !== null && rebinUph < REBIN_UPH_TARGET} />

              <Cell value={row?.admin_tl} />
              <Cell value={row?.productive_hours} />
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}
