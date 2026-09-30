import * as XLSX from 'xlsx'
import { normalizeHeader, parseCsvFile, toNumber } from './importSic'
import { EXCLUDED_STAFF_IDS } from './excludedStaff'
import type { BoardType } from './types'

export interface SectionRow {
  rank: number
  name: string
  units: number | null
}

export interface SectionImportResult {
  rows: SectionRow[]
  matchedCount: number
  detectedHeaders: string[]
  unrecognizedHeaders: string[]
  /** True when this came from a raw daily export that had to be summed & ranked, not a ready-made list. */
  aggregatedFromRaw?: boolean
  /** How many raw transaction rows were scanned (raw-export mode only). */
  rowsScanned?: number
  /** How many distinct operators were found after exclusions (raw-export mode only). */
  operatorsFound?: number
}

// One section's ready-made file only needs to say who and how many — which
// board/role it's for is already known from which "Choose File" button was
// used. (Rank is optional — rows without one fill whatever ranks are free.)
const HEADER_MAP: Record<string, 'rank' | 'name' | 'units'> = {
  rank: 'rank',
  position: 'rank',
  pos: 'rank',
  place: 'rank',
  no: 'rank',
  number: 'rank',
  num: 'rank',

  name: 'name',
  employee: 'name',
  employeename: 'name',
  opid: 'name',
  fopid: 'name',
  opfopid: 'name',
  operatorid: 'name',
  operator: 'name',
  associate: 'name',
  id: 'name',
  worker: 'name',
  picker: 'name',
  packer: 'name',

  units: 'units',
  unit: 'units',
  qty: 'units',
  quantity: 'units',
  count: 'units',
  total: 'units',
  totalunits: 'units',
}

// Header used for the real quantity moved in a raw WMS inventory export —
// e.g. "Actual inventory - change quantity". Matched exactly (not as a
// substring) so it never collides with the file's other "change quantity
// of ..." columns (available/occupied/transit inventory), which track
// different things.
const RAW_QUANTITY_HEADERS = new Set(['actualinventorychangequantity', 'quantity', 'qty'])

function findHeaderKeys(rows: Record<string, unknown>[]) {
  let nameKey: string | null = null
  let rawQtyKey: string | null = null
  let simpleUnitsKey: string | null = null
  if (rows.length > 0) {
    for (const key of Object.keys(rows[0])) {
      const normalized = normalizeHeader(key)
      if (!nameKey && HEADER_MAP[normalized] === 'name') nameKey = key
      if (!simpleUnitsKey && HEADER_MAP[normalized] === 'units') simpleUnitsKey = key
      if (!rawQtyKey && RAW_QUANTITY_HEADERS.has(normalized)) rawQtyKey = key
    }
  }
  return { nameKey, rawQtyKey, simpleUnitsKey }
}

/** Ready-made list: a handful of rows that already say Name + Units (+ optional Rank). */
function rowsToSectionSimple(rows: Record<string, unknown>[]): SectionImportResult {
  const detectedHeaders = new Set<string>()
  const unrecognizedHeaders = new Set<string>()
  const parsed: { rank: number | null; name: string; units: number | null }[] = []

  for (const raw of rows) {
    const mapped: Partial<Record<'rank' | 'name' | 'units', unknown>> = {}
    for (const [key, value] of Object.entries(raw)) {
      const field = HEADER_MAP[normalizeHeader(key)]
      if (!field) {
        if (key.trim()) unrecognizedHeaders.add(key.trim())
        continue
      }
      detectedHeaders.add(key.trim())
      mapped[field] = value
    }

    const name = mapped.name != null ? String(mapped.name).trim() : ''
    if (!name || EXCLUDED_STAFF_IDS.has(name.toLowerCase())) continue

    parsed.push({
      rank: mapped.rank != null ? toNumber(mapped.rank) : null,
      name,
      units: toNumber(mapped.units),
    })
  }

  // Rows with a valid, still-free rank (1-5) keep it; everything else fills
  // whatever ranks are left, in the order the rows appeared.
  const used = new Set<number>()
  const ranked: SectionRow[] = []
  const unranked: { name: string; units: number | null }[] = []
  parsed.forEach((row) => {
    if (row.rank && row.rank >= 1 && row.rank <= 5 && !used.has(row.rank)) {
      used.add(row.rank)
      ranked.push({ rank: row.rank, name: row.name, units: row.units })
    } else {
      unranked.push(row)
    }
  })
  let next = 1
  unranked.forEach((row) => {
    while (used.has(next) && next <= 5) next++
    if (next > 5) return // only 5 slots fit on the board
    used.add(next)
    ranked.push({ rank: next, name: row.name, units: row.units })
  })

  return {
    rows: ranked,
    matchedCount: ranked.length,
    detectedHeaders: [...detectedHeaders],
    unrecognizedHeaders: [...unrecognizedHeaders],
  }
}

/**
 * Raw daily export: thousands of individual transaction rows (Operator +
 * a quantity column). Sums units per operator, drops excluded TOB/Admin
 * staff, then ranks. Top 5 = the 5 highest totals. Bottom 5 = the lowest
 * totals *excluding whoever would already be in the top 5* — so with a
 * small operator pool (fewer than 10 people) the two boards never show the
 * same person twice; any bottom slot that can't be filled is left blank.
 */
function rowsToSectionFromRawExport(
  rows: Record<string, unknown>[],
  boardType: BoardType,
  nameKey: string,
  qtyKey: string
): SectionImportResult {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const rawName = row[nameKey]
    const name = rawName != null ? String(rawName).trim() : ''
    if (!name || EXCLUDED_STAFF_IDS.has(name.toLowerCase())) continue
    const qty = toNumber(row[qtyKey])
    if (qty == null) continue
    totals.set(name, (totals.get(name) ?? 0) + qty)
  }

  const sortedDesc = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const n = sortedDesc.length

  let picked: [string, number][]
  if (boardType === 'top5') {
    picked = sortedDesc.slice(0, 5)
  } else {
    const bottomCount = Math.min(5, Math.max(0, n - 5))
    picked = sortedDesc.slice(n - bottomCount, n).reverse() // lowest first
  }

  const ranked: SectionRow[] = picked.map(([name, units], i) => ({ rank: i + 1, name, units }))

  return {
    rows: ranked,
    matchedCount: ranked.length,
    detectedHeaders: [nameKey, qtyKey],
    unrecognizedHeaders: [],
    aggregatedFromRaw: true,
    rowsScanned: rows.length,
    operatorsFound: n,
  }
}

function rowsToSection(rows: Record<string, unknown>[], boardType: BoardType): SectionImportResult {
  const { nameKey, rawQtyKey, simpleUnitsKey } = findHeaderKeys(rows)
  // A recognized "Units"-style header means this is a ready-made list —
  // use the original row-by-row behaviour (and respect an explicit Rank).
  if (simpleUnitsKey) return rowsToSectionSimple(rows)
  // Otherwise, an operator column plus a raw inventory-change quantity
  // column means this is the big daily export — sum and rank it.
  if (nameKey && rawQtyKey) return rowsToSectionFromRawExport(rows, boardType, nameKey, rawQtyKey)
  // Fall back to the simple parser so unrecognized files still get a clear,
  // specific error message instead of a silent empty result.
  return rowsToSectionSimple(rows)
}

/**
 * Imports one leaderboard section (e.g. just "Top 5 Pickers") from either:
 *  - a ready-made CSV/XLSX with Name and Units columns (Rank optional), or
 *  - the raw daily inventory export (Operator + change-quantity columns),
 *    which gets summed per operator and ranked automatically.
 * TOB/Admin staff (see excludedStaff.ts) are always dropped from either.
 */
export async function importSectionFile(file: File, boardType: BoardType): Promise<SectionImportResult> {
  const isCsv = file.name.toLowerCase().endsWith('.csv')
  if (isCsv) {
    const rows = await parseCsvFile(file)
    return rowsToSection(rows, boardType)
  }
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: null })
  return rowsToSection(rows, boardType)
}
