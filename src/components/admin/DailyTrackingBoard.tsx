import { computeRate } from '../../lib/upmh'
import type { HourlyRow, TrackingInfo, TrackingRow } from '../../lib/types'

// Matches the shift's actual tracking window: starts at 10-11, wraps
// through midnight, and ends at 01-02.
const TRACKING_HOURS: string[] = Array.from({ length: 16 }, (_, i) => {
  const pad = (h: number) => h.toString().padStart(2, '0')
  const start = (10 + i) % 24
  const end = (11 + i) % 24
  return `${pad(start)}-${pad(end)}`
})

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}:</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded border border-white/15 bg-transparent px-1.5 py-1 text-xs text-slate-100 outline-none focus:border-cyan-400"
      />
    </div>
  )
}

function GroupHeaderCell({
  title,
  accent,
  colSpan,
  target,
}: {
  title: string
  accent: 'cyan' | 'red' | 'amber' | 'slate'
  colSpan: number
  target?: string
}) {
  const bg =
    accent === 'cyan'
      ? 'bg-cyan-500/90'
      : accent === 'red'
        ? 'bg-red-500/90'
        : accent === 'amber'
          ? 'bg-amber-500/90'
          : 'bg-slate-600/90'
  return (
    <th
      colSpan={colSpan}
      className={`border border-white/10 px-1 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-white ${bg}`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span>{title}</span>
        {target !== undefined && (
          <span className="flex items-center gap-1 rounded bg-black/25 px-1 py-0.5 text-[9px] font-semibold tracking-wide normal-case text-white/80">
            Target {target}
          </span>
        )}
      </div>
    </th>
  )
}

function SubHeaderCell({ label, accent }: { label: string; accent: 'cyan' | 'red' | 'amber' | 'slate' }) {
  const text = accent === 'cyan' ? 'text-cyan-300' : accent === 'red' ? 'text-red-400' : accent === 'amber' ? 'text-amber-300' : 'text-slate-300'
  return (
    <th
      className={`border border-white/10 bg-[var(--panel)] px-1 py-1 text-[9px] font-bold uppercase tracking-wide ${text}`}
    >
      {label}
    </th>
  )
}

function ComputedCell({ value, danger }: { value: number | null | undefined; danger?: boolean }) {
  return (
    <td
      className={`border border-white/10 bg-[var(--panel-2)] px-1 py-0.5 text-center text-[10px] tabular-nums ${
        danger ? 'font-bold text-red-400' : 'text-slate-100'
      }`}
    >
      {value ?? '—'}
    </td>
  )
}

// The Outbound SIC Data step's 24 hourly rows start at 06:00 (hour_index 0
// = "06:00-07:00"), while this board's rolling day starts at 10-11. Row j
// here lines up with SIC hour_index (j + 4) % 24 — e.g. j=0 ("10-11") is
// SIC index 4 ("10:00-11:00").
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

function EditableCell({
  value,
  onChange,
  danger,
}: {
  value: string | null
  onChange: (v: string) => void
  danger?: boolean
}) {
  return (
    <td className="border border-white/10 bg-[var(--panel-2)] p-0">
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent px-1 py-0.5 text-center text-[10px] outline-none focus:bg-white/5 focus:ring-1 focus:ring-cyan-400 ${
          danger ? 'font-bold text-red-400' : 'text-slate-100'
        }`}
      />
    </td>
  )
}

/**
 * A digital replica of the shop-floor "Daily Tracking" whiteboard (Pack /
 * Pick / Rebin ops, units and UPH per hour, plus Admin+TL and Productive
 * Hours), styled with the dashboard's own colors.
 *
 * Pack Ops, Pack Units, Pack UPH, Pick Ops, Pick Units and Pick UPH are all
 * read-only — they're pulled straight from the matching hour's Outbound SIC
 * Data (Ops = Pack/Pick Hrs, Units = the SIC units, UPH = the same UPH SIC
 * computes). The info bar (owner, targets, shift), Spiders, all of Rebin, and
 * Total (Admin+TL / Productive Hrs) are open for manual entry — saved to the
 * database (fiege_tracking_info / fiege_tracking_rows) via the same Save &
 * Broadcast button as the rest of Admin.
 */
export function DailyTrackingBoard({
  reportDate,
  onReportDateChange,
  hourly,
  trackingInfo,
  onTrackingInfoChange,
  trackingRows,
  onTrackingRowChange,
}: {
  reportDate: string
  onReportDateChange: (v: string) => void
  hourly: HourlyRow[]
  trackingInfo: TrackingInfo
  onTrackingInfoChange: (patch: Partial<TrackingInfo>) => void
  trackingRows: TrackingRow[]
  onTrackingRowChange: (hourIndex: number, patch: Partial<TrackingRow>) => void
}) {
  const rowByIndex = new Map(trackingRows.map((r) => [r.hour_index, r]))

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
        <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">Daily Tracking</h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-white/10 bg-[var(--panel)] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => onReportDateChange(e.target.value)}
              className="rounded border border-white/15 bg-transparent px-1.5 py-1 text-xs font-bold text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <TextField
            label="Owner AM"
            value={trackingInfo.owner_am ?? ''}
            onChange={(v) => onTrackingInfoChange({ owner_am: v })}
          />
          <TextField
            label="Owner PM"
            value={trackingInfo.owner_pm ?? ''}
            onChange={(v) => onTrackingInfoChange({ owner_pm: v })}
          />
          <div className="flex items-center gap-4">
            <TextField
              label="Target AM"
              value={trackingInfo.target_am ?? ''}
              onChange={(v) => onTrackingInfoChange({ target_am: v })}
            />
            <TextField
              label="Target PM"
              value={trackingInfo.target_pm ?? ''}
              onChange={(v) => onTrackingInfoChange({ target_pm: v })}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[var(--panel-2)] p-2">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[6.5%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="border border-white/10 bg-slate-700/90 px-1 py-1 font-display text-[11px] font-extrabold uppercase tracking-wide text-white"
              >
                Hour
              </th>
              <GroupHeaderCell title="Pack" accent="cyan" colSpan={4} target={String(PACK_UPH_TARGET)} />
              <GroupHeaderCell title="Pick" accent="red" colSpan={3} target={String(PICK_UPH_TARGET)} />
              <GroupHeaderCell title="Rebin" accent="amber" colSpan={3} target={String(REBIN_UPH_TARGET)} />
              <GroupHeaderCell title="Total" accent="slate" colSpan={2} />
            </tr>
            <tr>
              <SubHeaderCell label="Ops" accent="cyan" />
              <SubHeaderCell label="Spiders" accent="cyan" />
              <SubHeaderCell label="Units" accent="cyan" />
              <SubHeaderCell label="UPH" accent="cyan" />

              <SubHeaderCell label="Ops" accent="red" />
              <SubHeaderCell label="Units" accent="red" />
              <SubHeaderCell label="UPH" accent="red" />

              <SubHeaderCell label="Ops" accent="amber" />
              <SubHeaderCell label="Units" accent="amber" />
              <SubHeaderCell label="UPH" accent="amber" />

              <SubHeaderCell label="Admin + TL" accent="slate" />
              <SubHeaderCell label="Productive Hrs" accent="slate" />
            </tr>
          </thead>
          <tbody>
            {TRACKING_HOURS.map((slot, i) => {
              const row = rowByIndex.get(i)
              const sic = sicRowFor(hourly, i)
              const packOps = sic?.pack_hours ?? null
              const pickOps = sic?.pick_hours ?? null
              const pickUnits = sic?.pick_units ?? null
              const packUnits = sic?.pack_units ?? null
              const pickUph = computeRate(sic?.pick_units, sic?.pick_hours)
              const packUph = computeRate(sic?.pack_units, sic?.pack_hours)
              const rebinUph = parseUph(row?.rebin_uph ?? null)
              return (
                <tr key={slot}>
                  <td className="border border-white/10 bg-slate-700/40 px-1 py-0.5 font-display text-[10px] font-bold text-slate-200">
                    {slot}
                  </td>
                  <ComputedCell value={packOps} />
                  <EditableCell value={row?.spiders ?? null} onChange={(v) => onTrackingRowChange(i, { spiders: v })} />
                  <ComputedCell value={packUnits} />
                  <ComputedCell value={packUph} danger={packUph !== null && packUph < PACK_UPH_TARGET} />

                  <ComputedCell value={pickOps} />
                  <ComputedCell value={pickUnits} />
                  <ComputedCell value={pickUph} danger={pickUph !== null && pickUph < PICK_UPH_TARGET} />

                  <EditableCell
                    value={row?.rebin_ops ?? null}
                    onChange={(v) => onTrackingRowChange(i, { rebin_ops: v })}
                  />
                  <EditableCell
                    value={row?.rebin_units ?? null}
                    onChange={(v) => onTrackingRowChange(i, { rebin_units: v })}
                  />
                  <EditableCell
                    value={row?.rebin_uph ?? null}
                    onChange={(v) => onTrackingRowChange(i, { rebin_uph: v })}
                    danger={rebinUph !== null && rebinUph < REBIN_UPH_TARGET}
                  />

                  <EditableCell value={row?.admin_tl ?? null} onChange={(v) => onTrackingRowChange(i, { admin_tl: v })} />
                  <EditableCell
                    value={row?.productive_hours ?? null}
                    onChange={(v) => onTrackingRowChange(i, { productive_hours: v })}
                  />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
