import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { importSectionFile } from '../../lib/importLeaderboardSection'
import type { BoardType, LeaderboardEntry, Role } from '../../lib/types'

function RoleGroup({
  title,
  role,
  boardType,
  entries,
  accent,
  onChange,
}: {
  title: string
  role: Role
  boardType: BoardType
  entries: LeaderboardEntry[]
  accent: 'red' | 'cyan'
  onChange: (rank: number, patch: Partial<LeaderboardEntry>) => void
}) {
  const byRank = new Map(entries.filter((e) => e.role === role && e.board_type === boardType).map((e) => [e.rank, e]))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [importError, setImportError] = useState('')

  async function handleFile(file: File) {
    setImportError('')
    try {
      const result = await importSectionFile(file, boardType)
      if (result.matchedCount === 0) {
        setImportError(
          result.detectedHeaders.length === 0
            ? `Couldn't match any columns. Columns found: ${
                result.unrecognizedHeaders.slice(0, 8).join(', ') || '(none)'
              }. Name them e.g. "Name" and "Units" (Rank is optional) — or upload the raw daily export.`
            : `Found columns (${result.detectedHeaders.join(', ')}) but no usable rows — check the Name column has values.`
        )
        return
      }
      if (result.aggregatedFromRaw) {
        // Raw export replaces the whole section — clear stale ranks first
        // so nothing left over from a previous import/manual entry lingers.
        for (let rank = 1; rank <= 5; rank++) onChange(rank, { employee_name: '', units: null })
      }
      result.rows.forEach((row) => onChange(row.rank, { employee_name: row.name, units: row.units }))

      if (result.aggregatedFromRaw) {
        setFileName(
          `${file.name} — summed ${result.rowsScanned} rows, ${result.operatorsFound} operators, ${result.matchedCount} of 5 shown`
        )
        if (result.matchedCount < 5) {
          setImportError(
            `Only ${result.operatorsFound} eligible operators found (after excluding TOB/Admin), so ${
              5 - result.matchedCount
            } slot(s) are left blank rather than repeating someone already on the other board.`
          )
        }
      } else {
        setFileName(`${file.name} — ${result.matchedCount} of 5 matched`)
        if (result.matchedCount < 5) {
          setImportError(`Imported ${result.matchedCount} of 5 — the rest are unchanged below.`)
        }
      }
    } catch {
      setImportError('Could not read that file. Expected a CSV/XLSX with Name and Units columns, or the raw daily export.')
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${accent === 'red' ? 'border-red-500/40' : 'border-cyan-400/40'}`}
    >
      <h4
        className={`font-display text-base font-extrabold uppercase tracking-wide ${
          accent === 'red' ? 'text-red-400' : 'text-cyan-300'
        }`}
      >
        {title}
      </h4>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-white transition hover:bg-red-400"
        >
          <Upload size={14} />
          Choose File
        </button>
        <span className="text-xs text-slate-400">{fileName || 'No file chosen'}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      {importError && <p className="mt-2 text-xs text-red-400">{importError}</p>}

      <div className="mt-3 flex flex-col gap-2.5">
        {[1, 2, 3, 4, 5].map((rank) => {
          const entry = byRank.get(rank)
          const name = entry?.employee_name ?? ''
          const looksLikeUnits = name.trim() !== '' && /^\d+$/.test(name.trim())
          return (
            <div key={rank} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="w-4 shrink-0 font-display text-sm font-bold text-slate-500">{rank}</span>
                <input
                  type="text"
                  placeholder="OP / FOP ID (e.g. FOP_10105)"
                  value={name}
                  onChange={(e) => onChange(rank, { employee_name: e.target.value })}
                  className={`min-w-0 flex-1 rounded-lg border bg-[var(--panel)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400 ${
                    looksLikeUnits ? 'border-amber-500/60' : 'border-white/10'
                  }`}
                />
                <input
                  type="number"
                  placeholder="Units"
                  value={entry?.units ?? ''}
                  onChange={(e) => onChange(rank, { units: e.target.value === '' ? null : Number(e.target.value) })}
                  className="w-24 shrink-0 rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2 text-right text-sm text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>
              {looksLikeUnits && (
                <p className="pl-7 text-xs text-amber-400">
                  ⚠ That looks like a units count, not an ID — did you mean to put "{name.trim()}" in the Units box
                  instead, and enter the OP/FOP ID here?
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LeaderboardEditor({
  boardType,
  title,
  entries,
  onEntryChange,
  bannerMessage,
  onBannerChange,
}: {
  boardType: BoardType
  title: string
  entries: LeaderboardEntry[]
  onEntryChange: (role: Role, rank: number, patch: Partial<LeaderboardEntry>) => void
  bannerMessage?: string | null
  onBannerChange?: (v: string) => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
      <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">{title}</h3>

      {onBannerChange && (
        <div className="mt-4">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Banner message (leave blank for default)
          </label>
          <input
            type="text"
            value={bannerMessage ?? ''}
            onChange={(e) => onBannerChange(e.target.value)}
            placeholder="Well done team — outstanding work, keep it up!"
            className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RoleGroup
          title={`${boardType === 'top5' ? 'TOP 5' : 'BOTTOM 5'} PICKERS`}
          role="picker"
          boardType={boardType}
          entries={entries}
          accent="red"
          onChange={(rank, patch) => onEntryChange('picker', rank, patch)}
        />
        <RoleGroup
          title={`${boardType === 'top5' ? 'TOP 5' : 'BOTTOM 5'} PACKERS`}
          role="packer"
          boardType={boardType}
          entries={entries}
          accent="cyan"
          onChange={(rank, patch) => onEntryChange('packer', rank, patch)}
        />
      </div>
    </div>
  )
}
