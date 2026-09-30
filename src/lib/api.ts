import { collection, doc, documentId, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { HOUR_SLOTS } from './constants'
import type { HourlyRow, LeaderboardEntry, ReportDay, TrackingInfo, TrackingRow } from './types'

export interface FullReportDay {
  day: ReportDay
  hourly: HourlyRow[]
  leaderboard: LeaderboardEntry[]
  trackingInfo: TrackingInfo
  trackingRows: TrackingRow[]
}

// --- Firestore layout -------------------------------------------------
// One document per report date per collection (not one row per hour/entry
// like the old Postgres tables) — everything for a given day that's always
// read/written together lives in a single doc, so loading or saving a full
// day costs 5 document reads/writes total instead of 60+ row operations.
// That matters on Firestore's free tier, which is metered by document
// read/write count.
//
//   reportDays/{date}          -> flat ReportDay fields
//   hourlyData/{date}          -> { report_date, rows: HourlyRow[] }
//   leaderboardEntries/{date}  -> { report_date, entries: LeaderboardEntry[] }
//   trackingInfo/{date}        -> flat TrackingInfo fields
//   trackingRows/{date}        -> { report_date, rows: TrackingRow[] }

const REPORT_DAYS = 'reportDays'
const HOURLY_DATA = 'hourlyData'
const LEADERBOARD_ENTRIES = 'leaderboardEntries'
const TRACKING_INFO = 'trackingInfo'
const TRACKING_ROWS = 'trackingRows'

// Matches the Daily Tracking board's own rolling window (10-11 through
// 01-02 — see DailyTrackingBoard.tsx / DailyTrackingView.tsx), not the
// 06:00-start 24-row SIC data cycle.
const TRACKING_ROW_COUNT = 16

function emptyDay(reportDate: string): ReportDay {
  return {
    report_date: reportDate,
    banner_message: null,
    units_to_pick: null,
    units_to_pack: null,
    pre_processed_failed: null,
    backlog_orders: null,
    overpicks: null,
    updated_at: new Date().toISOString(),
  }
}

function emptyHourlyRows(reportDate: string): HourlyRow[] {
  return HOUR_SLOTS.map((slot, i) => ({
    report_date: reportDate,
    hour_index: i,
    hour_slot: slot,
    pick_plan: null,
    pick_units: null,
    pick_hours: null,
    pack_plan: null,
    pack_units: null,
    pack_hours: null,
  }))
}

export function emptyTrackingInfo(reportDate: string): TrackingInfo {
  return {
    report_date: reportDate,
    owner_am: null,
    owner_pm: null,
    target_am: null,
    target_pm: null,
    shift: null,
  }
}

export function emptyTrackingRows(reportDate: string): TrackingRow[] {
  return Array.from({ length: TRACKING_ROW_COUNT }, (_, hour_index) => ({
    report_date: reportDate,
    hour_index,
    spiders: null,
    rebin_ops: null,
    rebin_units: null,
    rebin_uph: null,
    admin_tl: null,
    productive_hours: null,
  }))
}

function emptyLeaderboard(reportDate: string): LeaderboardEntry[] {
  const out: LeaderboardEntry[] = []
  for (const board_type of ['top5', 'bottom5'] as const) {
    for (const role of ['picker', 'packer'] as const) {
      for (let rank = 1; rank <= 5; rank++) {
        out.push({ report_date: reportDate, board_type, role, rank, employee_name: '', units: null })
      }
    }
  }
  return out
}

/** Merges saved rows onto a full set of empty defaults, keyed by hour_index — so a
 * partially-saved day (or one that's never been saved) still renders every row. */
function mergeByHourIndex<T extends { hour_index: number }>(defaults: T[], saved: T[] | undefined): T[] {
  const byIndex = new Map((saved ?? []).map((r) => [r.hour_index, r]))
  return defaults.map((row) => byIndex.get(row.hour_index) ?? row)
}

export async function fetchFullReportDay(reportDate: string): Promise<FullReportDay> {
  const [dayRes, hourlyRes, leaderboardRes, trackingInfoRes, trackingRowsRes] = await Promise.all([
    getDoc(doc(db, REPORT_DAYS, reportDate)),
    getDoc(doc(db, HOURLY_DATA, reportDate)),
    getDoc(doc(db, LEADERBOARD_ENTRIES, reportDate)),
    getDoc(doc(db, TRACKING_INFO, reportDate)),
    getDoc(doc(db, TRACKING_ROWS, reportDate)),
  ])

  const day: ReportDay = dayRes.exists() ? (dayRes.data() as ReportDay) : emptyDay(reportDate)

  const hourly = mergeByHourIndex(
    emptyHourlyRows(reportDate),
    hourlyRes.exists() ? (hourlyRes.data().rows as HourlyRow[]) : undefined
  )

  const lbKey = (e: LeaderboardEntry) => `${e.board_type}-${e.role}-${e.rank}`
  const savedEntries = leaderboardRes.exists() ? (leaderboardRes.data().entries as LeaderboardEntry[]) : []
  const lbByKey = new Map(savedEntries.map((e) => [lbKey(e), e]))
  const leaderboard = emptyLeaderboard(reportDate).map((e) => lbByKey.get(lbKey(e)) ?? e)

  const trackingInfo: TrackingInfo = trackingInfoRes.exists()
    ? (trackingInfoRes.data() as TrackingInfo)
    : emptyTrackingInfo(reportDate)

  const trackingRows = mergeByHourIndex(
    emptyTrackingRows(reportDate),
    trackingRowsRes.exists() ? (trackingRowsRes.data().rows as TrackingRow[]) : undefined
  )

  return { day, hourly, leaderboard, trackingInfo, trackingRows }
}

/**
 * Just the leaderboard rows for one date — used by the "All Boards" overview,
 * which lets admins browse any past date without loading/affecting the
 * SIC/units data the rest of the Admin panel is currently editing.
 */
export async function fetchLeaderboardEntries(reportDate: string): Promise<LeaderboardEntry[]> {
  const snap = await getDoc(doc(db, LEADERBOARD_ENTRIES, reportDate))
  if (!snap.exists()) return []
  return (snap.data().entries as LeaderboardEntry[]) ?? []
}

/** Same as above but for every date in [startDate, endDate] inclusive — used by the "All Boards" overview's monthly view. */
export async function fetchLeaderboardEntriesRange(startDate: string, endDate: string): Promise<LeaderboardEntry[]> {
  // Document IDs are ISO date strings ("2026-09-30"), which sort correctly
  // as plain strings, so a range query on the document ID itself does the
  // job with no extra indexed field needed.
  const q = query(
    collection(db, LEADERBOARD_ENTRIES),
    where(documentId(), '>=', startDate),
    where(documentId(), '<=', endDate)
  )
  const snap = await getDocs(q)
  const out: LeaderboardEntry[] = []
  snap.forEach((d) => {
    const entries = (d.data().entries as LeaderboardEntry[]) ?? []
    out.push(...entries)
  })
  out.sort((a, b) => {
    if (a.report_date !== b.report_date) return a.report_date < b.report_date ? -1 : 1
    if (a.board_type !== b.board_type) return a.board_type < b.board_type ? -1 : 1
    if (a.role !== b.role) return a.role < b.role ? -1 : 1
    return a.rank - b.rank
  })
  return out
}

export async function saveAndBroadcast(data: FullReportDay): Promise<void> {
  const { day, hourly, leaderboard, trackingInfo, trackingRows } = data
  const reportDate = day.report_date

  // One atomic batch — either everything for this day lands, or nothing
  // does, unlike the old per-table upserts which could partially fail.
  const batch = writeBatch(db)
  batch.set(doc(db, REPORT_DAYS, reportDate), { ...day, updated_at: new Date().toISOString() })
  batch.set(doc(db, HOURLY_DATA, reportDate), {
    report_date: reportDate,
    rows: hourly.map(({ id: _id, ...rest }) => rest),
  })
  batch.set(doc(db, LEADERBOARD_ENTRIES, reportDate), {
    report_date: reportDate,
    entries: leaderboard.map(({ id: _id, ...rest }) => rest),
  })
  batch.set(doc(db, TRACKING_INFO, reportDate), { ...trackingInfo, updated_at: new Date().toISOString() })
  batch.set(doc(db, TRACKING_ROWS, reportDate), {
    report_date: reportDate,
    rows: trackingRows.map(({ id: _id, ...rest }) => rest),
  })
  await batch.commit()
}

export async function resetDay(reportDate: string): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(doc(db, HOURLY_DATA, reportDate))
  batch.delete(doc(db, LEADERBOARD_ENTRIES, reportDate))
  batch.delete(doc(db, TRACKING_ROWS, reportDate))
  batch.delete(doc(db, TRACKING_INFO, reportDate))
  batch.set(doc(db, REPORT_DAYS, reportDate), emptyDay(reportDate))
  await batch.commit()
}
