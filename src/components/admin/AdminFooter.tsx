export function AdminFooter({
  saving,
  savedAt,
  error,
  onReset,
  onCancel,
  onSave,
}: {
  saving: boolean
  savedAt: Date | null
  error: string
  onReset: () => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[var(--panel-2)]/95 p-4 backdrop-blur">
      <div className="text-sm">
        {error && <span className="text-red-400">{error}</span>}
        {!error && savedAt && (
          <span className="text-emerald-400">Broadcast live at {savedAt.toLocaleTimeString()}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="rounded-lg border border-red-500/50 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-red-400 transition hover:bg-red-500/10"
        >
          Reset for New Day
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/15 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-slate-300 transition hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-red-500 px-5 py-2 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-400 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save & Broadcast'}
        </button>
      </div>
    </div>
  )
}
