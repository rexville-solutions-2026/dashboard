import { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import type { HourlyRow } from '../../lib/types'
import { computeRate, sum } from '../../lib/upmh'
import { importSicFile } from '../../lib/importSic'
import { HOUR_SLOTS } from '../../lib/constants'
import { NumberCell } from './NumberCell'

const HOUR_SLOTS_COUNT = HOUR_SLOTS.length

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--panel-2)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}

export function Step1SicData({
  reportDate,
  onReportDateChange,
  hourly,
  onHourlyChange,
}: {
  reportDate: string
  onReportDateChange: (v: string) => void
  hourly: HourlyRow[]
  onHourlyChange: (rows: HourlyRow[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [importError, setImportError] = useState('')

  const totals = useMemo(() => {
    const pickUnits = sum(hourly.map((r) => r.pick_units))
    const packUnits = sum(hourly.map((r) => r.pack_units))
    const pickHours = sum(hourly.map((r) => r.pick_hours))
    const packHours = sum(hourly.map((r) => r.pack_hours))
    return {
      pickUnits,
      packUnits,
      pickHours,
      packHours,
      pickUpmh: computeRate(pickUnits, pickHours),
      packUpmh: computeRate(packUnits, packHours),
    }
  }, [hourly])

  const issues = useMemo(() => {
    const problems: string[] = []
    for (const row of hourly) {
      if (row.pick_units && !row.pick_hours) problems.push(`${row.hour_slot}: pick units without pick hours`)
      if (row.pack_units && !row.pack_hours) problems.push(`${row.hour_slot}: pack units without pack hours`)
    }
    return problems
  }, [hourly])

  function updateRow(index: number, patch: Partial<HourlyRow>) {
    const next = hourly.slice()
    next[index] = { ...next[index], ...patch }
    onHourlyChange(next)
  }

  async function handleFile(file: File) {
    setImportError('')
    try {
      const result = await importSicFile(file, reportDate)

      if (result.availableSheetDates) {
        setImportError(
          `No sheet in that workbook matches the report date (${reportDate}). Sheets found: ${result.availableSheetDates
            .slice(0, 6)
            .join(', ')}${result.availableSheetDates.length > 6 ? '…' : ''}. Change the report date above to match, or pick the right file.`
        )
        return
      }

      if (result.matchedRowCount === 0) {
        setImportError(
          result.detectedHeaders.length === 0
            ? `Couldn't match any columns in that file to Hour / Pick / Pack fields. Columns found: ${
                result.unrecognizedHeaders.slice(0, 8).join(', ') || '(none)'
              }. Rename them (e.g. "Hour", "Pick Units", "Pick Hours", "Pack Units", "Pack Hours") or enter the data in the table below.`
            : `Found recognizable columns (${result.detectedHeaders.join(', ')}) but no rows matched an hour slot — check the Hour column's format. Nothing was imported.`
        )
        return
      }
      onHourlyChange(result.rows)
      const sheetNote = result.sheetUsed ? `, sheet "${result.sheetUsed}"` : ''
      setFileName(`${file.name}${sheetNote} — ${result.matchedRowCount} hour${result.matchedRowCount === 1 ? '' : 's'} matched`)
      if (result.matchedRowCount < HOUR_SLOTS_COUNT) {
        setImportError(
          `Imported ${result.matchedRowCount} of 24 hours — the rest are still blank below. Double-check the file covers the full day.`
        )
      }
    } catch {
      setImportError('Could not read that file. Expected a CSV/XLSX with Hour, Pick/Pack Plan, Units and Hours columns.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
        <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">Import CSV / Excel</h3>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-400"
          >
            <Upload size={16} />
            Choose File
          </button>
          <span className="text-sm text-slate-400">{fileName || 'No file chosen'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-slate-400">Report date:</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => onReportDateChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-[var(--panel)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
        </div>
        {importError && <p className="mt-3 text-sm text-red-400">{importError}</p>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] p-5">
        <h3 className="font-display text-lg font-extrabold uppercase tracking-wide">Today's Hourly Data</h3>
        <p className="mt-1 text-sm text-slate-400">
          Editable preview. Hours are the man-hours worked that hour — UPMH = units ÷ hours.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Pick UPMH" value={totals.pickUpmh?.toString() ?? '—'} accent="#ef4444" />
          <StatCard label="Pack UPMH" value={totals.packUpmh?.toString() ?? '—'} accent="#22d3ee" />
          <StatCard label="Pick Hours" value={totals.pickHours.toString()} accent="#f8fafc" />
          <StatCard label="Pack Hours" value={totals.packHours.toString()} accent="#f8fafc" />
        </div>

        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            issues.length === 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          }`}
        >
          {issues.length === 0
            ? '✓ UPMH validated — every hour with units has actual hours.'
            : `⚠ ${issues.length} row(s) need attention: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? '…' : ''}`}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Hour</th>
                <th className="px-2 text-red-400">Pick Plan</th>
                <th className="px-2 text-red-400">Pick Units</th>
                <th className="px-2 text-red-400">Pick Hrs</th>
                <th className="px-2 text-red-400">Pick UPMH</th>
                <th className="px-2 text-cyan-300">Pack Plan</th>
                <th className="px-2 text-cyan-300">Pack Units</th>
                <th className="px-2 text-cyan-300">Pack Hrs</th>
                <th className="px-2 text-cyan-300">Pack UPMH</th>
              </tr>
            </thead>
            <tbody>
              {hourly.map((row, i) => {
                const pickUpmh = computeRate(row.pick_units, row.pick_hours)
                const packUpmh = computeRate(row.pack_units, row.pack_hours)
                return (
                  <tr key={row.hour_slot} className="border-t border-white/5">
                    <td className="py-1.5 pr-3 text-slate-400">{row.hour_slot}</td>
                    <td className="px-2">
                      <NumberCell value={row.pick_plan} onChange={(v) => updateRow(i, { pick_plan: v })} />
                    </td>
                    <td className="px-2">
                      <NumberCell value={row.pick_units} onChange={(v) => updateRow(i, { pick_units: v })} />
                    </td>
                    <td className="px-2">
                      <NumberCell value={row.pick_hours} onChange={(v) => updateRow(i, { pick_hours: v })} />
                    </td>
                    <td className="px-2 text-right tabular-nums text-slate-400">{pickUpmh ?? '—'}</td>
                    <td className="px-2">
                      <NumberCell value={row.pack_plan} onChange={(v) => updateRow(i, { pack_plan: v })} />
                    </td>
                    <td className="px-2">
                      <NumberCell value={row.pack_units} onChange={(v) => updateRow(i, { pack_units: v })} />
                    </td>
                    <td className="px-2">
                      <NumberCell value={row.pack_hours} onChange={(v) => updateRow(i, { pack_hours: v })} />
                    </td>
                    <td className="px-2 text-right tabular-nums text-slate-400">{packUpmh ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 font-semibold">
                <td className="py-2 pr-3 text-slate-300">Validation</td>
                <td className="px-2" />
                <td className="px-2 text-right tabular-nums">{totals.pickUnits}</td>
                <td className="px-2 text-right tabular-nums">{totals.pickHours}</td>
                <td className="px-2 text-right tabular-nums">{totals.pickUpmh ?? '—'}</td>
                <td className="px-2" />
                <td className="px-2 text-right tabular-nums">{totals.packUnits}</td>
                <td className="px-2 text-right tabular-nums">{totals.packHours}</td>
                <td className="px-2 text-right tabular-nums">{totals.packUpmh ?? '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
