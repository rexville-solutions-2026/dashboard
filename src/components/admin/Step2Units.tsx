import type { ReportDay } from '../../lib/types'

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
      />
    </div>
  )
}

export function Step2Units({
  day,
  onChange,
}: {
  day: ReportDay
  onChange: (patch: Partial<ReportDay>) => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
      <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">Units to Pick / Pack (Board 2)</h3>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Units to Pick" value={day.units_to_pick} onChange={(v) => onChange({ units_to_pick: v })} />
        <Field label="Units to Pack" value={day.units_to_pack} onChange={(v) => onChange({ units_to_pack: v })} />
        <Field
          label="Pre Processed Failed"
          value={day.pre_processed_failed}
          onChange={(v) => onChange({ pre_processed_failed: v })}
        />
        <Field
          label="Backlog Orders"
          value={day.backlog_orders}
          onChange={(v) => onChange({ backlog_orders: v })}
        />
        <Field label="Overpicks" value={day.overpicks} onChange={(v) => onChange({ overpicks: v })} />
      </div>
    </div>
  )
}
