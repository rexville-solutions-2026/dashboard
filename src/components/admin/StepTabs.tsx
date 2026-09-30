const STEPS = [
  { id: 1, label: 'Outbound SIC Data' },
  { id: 2, label: 'Units to Pick / Pack' },
  { id: 3, label: 'Top 5 Board' },
  { id: 4, label: 'Bottom 5 Board' },
  { id: 5, label: 'All Boards' },
  { id: 6, label: 'Daily Tracking' },
]

export function StepTabs({ step, onStepChange }: { step: number; onStepChange: (s: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-[var(--panel-2)] p-2">
      {STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => onStepChange(s.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 font-display text-xs font-bold uppercase tracking-wide transition ${
            step === s.id ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{s.id}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}
