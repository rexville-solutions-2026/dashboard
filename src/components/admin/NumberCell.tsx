export function NumberCell({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-20 rounded-md border border-white/10 bg-[var(--panel-2)] px-2 py-1 text-right text-sm tabular-nums text-slate-100 outline-none focus:border-cyan-400"
    />
  )
}
