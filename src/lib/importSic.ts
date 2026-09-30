import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { HOUR_SLOTS } from './constants'
import type { HourlyRow } from './types'

export interface SicImportResult {
  rows: HourlyRow[]
  matchedRowCount: number
  detectedHeaders: string[]
  unrecognizedHeaders: string[]
  /** Which sheet the data came from, when the file had multiple date-named sheets (the "Outbound SIC Report" template). */
  sheetUsed?: string
  /** Set when the file looked like the dated multi-sheet template but no sheet matched the requested report date. */
  availableSheetDates?: string[]
}

function emptyGrid(reportDate: string): Map<number, HourlyRow> {
  const grid = new Map<number, HourlyRow>()
  HOUR_SLOTS.forEach((slot, i) =>
    grid.set(i, {
      report_date: reportDate,
      hour_index: i,
      hour_slot: slot,
      pick_plan: null,
      pick_units: null,
      pick_hours: null,
      pack_plan: null,
      pack_units: null,
      pack_hours: null,
    })
  )
  return grid
}

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Excel serial time (a fraction of a day, e.g. 0.25 = 06:00) -> "HH:00". */
function excelSerialToHour(n: number): string | null {
  if (n < 0 || n >= 2) return null // not a plausible time-of-day serial
  const totalMinutes = Math.round((n % 1) * 24 * 60)
  const h = Math.floor(totalMinutes / 60) % 24
  return `${h.toString().padStart(2, '0')}:00`
}

/** Normalizes all sorts of "hour" cell shapes (Date, Excel serial, "6", "06:00", "06:00-07:00", "6 AM") to a starting hour string like "06:00". */
function normalizeHourValue(value: unknown): string | null {
  if (value instanceof Date) {
    return `${value.getHours().toString().padStart(2, '0')}:00`
  }
  if (typeof value === 'number') {
    // Whole numbers 0-23 are treated as an hour-of-day; fractional values as an Excel time serial.
    if (Number.isInteger(value) && value >= 0 && value <= 23) {
      return `${value.toString().padStart(2, '0')}:00`
    }
    return excelSerialToHour(value)
  }
  const str = String(value).trim()
  if (!str) return null
  // "06:00-07:00" / "06:00 - 07:00" -> take the start.
  const rangeStart = str.split('-')[0]?.trim()
  const match = (rangeStart ?? str).match(/(\d{1,2})(?::(\d{2}))?/)
  if (!match) return null
  let h = Number(match[1])
  if (!Number.isFinite(h)) return null
  const isPm = /pm/i.test(str) && h < 12
  if (isPm) h += 12
  if (h === 24) h = 0
  if (h < 0 || h > 23) return null
  return `${h.toString().padStart(2, '0')}:00`
}

// ---------------------------------------------------------------------------
// Path 1: a plain flat table — one header row, one row per hour. Used for
// CSV exports and any XLSX that isn't the dated "Outbound SIC Report"
// template below.
// ---------------------------------------------------------------------------

// Recognized header names (normalized: lowercased, letters/digits only) mapped to our field.
// Kept deliberately generous — real-world exports name these columns all sorts of ways.
const HEADER_MAP: Record<string, keyof HourlyRow> = {
  hour: 'hour_slot',
  hourslot: 'hour_slot',
  hourrange: 'hour_slot',
  timeslot: 'hour_slot',
  time: 'hour_slot',
  shift: 'hour_slot',
  interval: 'hour_slot',

  pickplan: 'pick_plan',
  planpick: 'pick_plan',
  pickplanned: 'pick_plan',
  pickplanunits: 'pick_plan',

  pickunits: 'pick_units',
  unitspicked: 'pick_units',
  pickedunits: 'pick_units',
  pickactual: 'pick_units',
  pickqty: 'pick_units',
  pick: 'pick_units',

  pickhrs: 'pick_hours',
  pickhours: 'pick_hours',
  pickmanhours: 'pick_hours',
  pickmh: 'pick_hours',
  pickhr: 'pick_hours',

  packplan: 'pack_plan',
  planpack: 'pack_plan',
  packplanned: 'pack_plan',
  packplanunits: 'pack_plan',

  packunits: 'pack_units',
  unitspacked: 'pack_units',
  packedunits: 'pack_units',
  packactual: 'pack_units',
  packqty: 'pack_units',
  pack: 'pack_units',

  packhrs: 'pack_hours',
  packhours: 'pack_hours',
  packmanhours: 'pack_hours',
  packmh: 'pack_hours',
  packhr: 'pack_hours',
}

export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Turns parsed spreadsheet rows (array of objects) into our 24-row hourly grid. */
export function rowsToHourlyGrid(reportDate: string, rows: Record<string, unknown>[]): SicImportResult {
  const grid = emptyGrid(reportDate)
  const detectedHeaders = new Set<string>()
  const unrecognizedHeaders = new Set<string>()
  let matchedRowCount = 0

  for (const raw of rows) {
    const mapped: Partial<HourlyRow> = {}
    let hourRaw: unknown

    for (const [key, value] of Object.entries(raw)) {
      const normalized = normalizeHeader(key)
      const field = HEADER_MAP[normalized]
      if (!field) {
        if (key.trim()) unrecognizedHeaders.add(key.trim())
        continue
      }
      detectedHeaders.add(key.trim())
      if (field === 'hour_slot') {
        hourRaw = value
      } else {
        ;(mapped as Record<string, number | null>)[field] = toNumber(value)
      }
    }

    const hourStart = hourRaw !== undefined ? normalizeHourValue(hourRaw) : null
    if (!hourStart) continue

    const idx = HOUR_SLOTS.findIndex((s) => s.startsWith(hourStart))
    if (idx === -1) continue

    grid.set(idx, { ...grid.get(idx)!, ...mapped, hour_index: idx, hour_slot: HOUR_SLOTS[idx] })
    matchedRowCount += 1
  }

  return {
    rows: HOUR_SLOTS.map((_, i) => grid.get(i)!),
    matchedRowCount,
    detectedHeaders: [...detectedHeaders],
    unrecognizedHeaders: [...unrecognizedHeaders],
  }
}

export function parseCsvFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err: Error) => reject(err),
    })
  })
}

// ---------------------------------------------------------------------------
// Path 2: the real "Outbound SIC Report" workbook — one sheet per day (named
// like "04.09.26", "1.08.2026", "BH 31.08.26"), each with a 3-row grouped
// header (row: "Pick"/"Pack"/... ; row: "Hours"/"Units"/"UPH" ; row:
// "Plan"/"Actual") starting at the "Hour" column, then 24 hourly data rows.
// ---------------------------------------------------------------------------

type Grid = unknown[][]

function cell(grid: Grid, r: number, c: number): unknown {
  return grid[r]?.[c] ?? null
}

function cellText(grid: Grid, r: number, c: number): string {
  const v = cell(grid, r, c)
  return v === null || v === undefined ? '' : String(v).trim()
}

/** Parses a sheet-tab name like "04.09.26", "1.08.2026", "BH 31.08.26 " into {y,m,d}, or null. */
function parseSheetDate(sheetName: string): { y: number; m: number; d: number } | null {
  const cleaned = sheetName.replace(/^BH\s*/i, '').trim()
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (!match) return null
  const d = Number(match[1])
  const m = Number(match[2])
  let y = Number(match[3])
  if (y < 100) y += 2000
  if (d < 1 || d > 31 || m < 1 || m > 12) return null
  return { y, m, d }
}

function isoToParts(reportDate: string): { y: number; m: number; d: number } | null {
  const match = reportDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

/** Finds the sheet whose tab name is the given report date, ignoring the "Template" sheet. */
function findSheetForDate(sheetNames: string[], reportDate: string): string | null {
  const target = isoToParts(reportDate)
  if (!target) return null
  for (const name of sheetNames) {
    if (normalizeHeader(name) === 'template') continue
    const parsed = parseSheetDate(name)
    if (parsed && parsed.y === target.y && parsed.m === target.m && parsed.d === target.d) return name
  }
  return null
}

/** Forward-fills a header row across merged-cell gaps (blank cells inherit the value to their left). */
function forwardFill(grid: Grid, row: number, fromCol: number, toCol: number): string[] {
  const out: string[] = []
  let last = ''
  for (let c = fromCol; c <= toCol; c++) {
    const v = cellText(grid, row, c)
    if (v) last = v
    out.push(last)
  }
  return out
}

const PICK_UNIT_FIELDS: Record<string, keyof HourlyRow> = { plan: 'pick_plan', actual: 'pick_units' }
const PACK_UNIT_FIELDS: Record<string, keyof HourlyRow> = { plan: 'pack_plan', actual: 'pack_units' }

/**
 * Tries to parse a single sheet as the "Outbound SIC Report" template's grid
 * (3-row grouped header, then 24 hourly rows). Returns null if this sheet
 * doesn't look like that shape at all (no "Hour" header found).
 */
function parseSicTemplateSheet(grid: Grid, reportDate: string): SicImportResult | null {
  // Find the header row: a row with "Hour" in an early column.
  let headerRow = -1
  let hourCol = -1
  const maxScanRows = Math.min(grid.length, 30)
  for (let r = 0; r < maxScanRows; r++) {
    for (let c = 0; c < 6; c++) {
      if (normalizeHeader(cellText(grid, r, c)) === 'hour') {
        headerRow = r
        hourCol = c
        break
      }
    }
    if (headerRow !== -1) break
  }
  if (headerRow === -1 || headerRow < 2) return null

  const groupRow = headerRow - 2
  const subRow = headerRow - 1
  const maxCol = Math.max(0, ...grid.map((row) => row.length - 1))

  const groups = forwardFill(grid, groupRow, hourCol + 1, maxCol)
  const subs = forwardFill(grid, subRow, hourCol + 1, maxCol)

  // Map each data column to a HourlyRow field, based on (group, sub, plan/actual).
  const columnField = new Map<number, keyof HourlyRow>()
  const detectedHeaders = new Set<string>()
  for (let c = hourCol + 1; c <= maxCol; c++) {
    const group = normalizeHeader(groups[c - (hourCol + 1)] ?? '')
    const sub = normalizeHeader(subs[c - (hourCol + 1)] ?? '')
    const planActual = normalizeHeader(cellText(grid, headerRow, c))
    if (!group || !sub || !planActual) continue

    let fieldMap: Record<string, keyof HourlyRow> | null = null
    if (group === 'pick' && sub === 'units') fieldMap = PICK_UNIT_FIELDS
    else if (group === 'pack' && sub === 'units') fieldMap = PACK_UNIT_FIELDS
    else if (group === 'pick' && sub === 'hours' && planActual === 'actual') {
      columnField.set(c, 'pick_hours')
      detectedHeaders.add('Pick Hours (Actual)')
      continue
    } else if (group === 'pack' && sub === 'hours' && planActual === 'actual') {
      columnField.set(c, 'pack_hours')
      detectedHeaders.add('Pack Hours (Actual)')
      continue
    }
    if (fieldMap && fieldMap[planActual]) {
      columnField.set(c, fieldMap[planActual])
      detectedHeaders.add(`${groups[c - (hourCol + 1)]} ${subs[c - (hourCol + 1)]} (${planActual})`)
    }
  }

  if (columnField.size === 0) return null // has an "Hour" header but not this template's shape

  const outGrid = emptyGrid(reportDate)
  let matchedRowCount = 0
  for (let r = headerRow + 1; r < grid.length; r++) {
    const hourRaw = cell(grid, r, hourCol)
    if (hourRaw === null || normalizeHeader(String(hourRaw)) === 'total') break
    const hourStart = normalizeHourValue(hourRaw)
    if (!hourStart) continue
    const idx = HOUR_SLOTS.findIndex((s) => s.startsWith(hourStart))
    if (idx === -1) continue

    const patch: Partial<HourlyRow> = {}
    for (const [c, field] of columnField) {
      ;(patch as Record<string, number | null>)[field] = toNumber(cell(grid, r, c))
    }
    outGrid.set(idx, { ...outGrid.get(idx)!, ...patch, hour_index: idx, hour_slot: HOUR_SLOTS[idx] })
    matchedRowCount += 1
  }

  return {
    rows: HOUR_SLOTS.map((_, i) => outGrid.get(i)!),
    matchedRowCount,
    detectedHeaders: [...detectedHeaders],
    unrecognizedHeaders: [],
  }
}

export async function importSicFile(file: File, reportDate: string): Promise<SicImportResult> {
  const isCsv = file.name.toLowerCase().endsWith('.csv')

  if (!isCsv) {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetNames = workbook.SheetNames

    // Does this look like the dated multi-sheet "Outbound SIC Report" template at all?
    const looksLikeDatedTemplate = sheetNames.some((n) => parseSheetDate(n) !== null)
    if (looksLikeDatedTemplate) {
      const matchedSheet = findSheetForDate(sheetNames, reportDate)
      if (!matchedSheet) {
        return {
          rows: HOUR_SLOTS.map((slot, i) => ({
            report_date: reportDate,
            hour_index: i,
            hour_slot: slot,
            pick_plan: null,
            pick_units: null,
            pick_hours: null,
            pack_plan: null,
            pack_units: null,
            pack_hours: null,
          })),
          matchedRowCount: 0,
          detectedHeaders: [],
          unrecognizedHeaders: [],
          availableSheetDates: sheetNames.filter((n) => normalizeHeader(n) !== 'template'),
        }
      }
      const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[matchedSheet], {
        header: 1,
        defval: null,
        raw: true,
      })
      const result = parseSicTemplateSheet(grid, reportDate)
      if (result) return { ...result, sheetUsed: matchedSheet }
      // Fall through to flat-table parsing of that same sheet as a last resort.
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[matchedSheet], { defval: null })
      return { ...rowsToHourlyGrid(reportDate, rows), sheetUsed: matchedSheet }
    }

    // Not the dated template — treat the first sheet as a plain flat table.
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetNames[0]], { defval: null })
    return rowsToHourlyGrid(reportDate, rows)
  }

  const rows = await parseCsvFile(file)
  return rowsToHourlyGrid(reportDate, rows)
}
