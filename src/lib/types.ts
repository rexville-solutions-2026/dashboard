export type BoardType = 'top5' | 'bottom5'
export type Role = 'picker' | 'packer'

export interface ReportDay {
  report_date: string
  banner_message: string | null
  units_to_pick: number | null
  units_to_pack: number | null
  pre_processed_failed: number | null
  backlog_orders: number | null
  overpicks: number | null
  updated_at: string
}

export interface HourlyRow {
  id?: string
  report_date: string
  hour_index: number
  hour_slot: string
  pick_plan: number | null
  pick_units: number | null
  pick_hours: number | null
  pack_plan: number | null
  pack_units: number | null
  pack_hours: number | null
}

export interface LeaderboardEntry {
  id?: string
  report_date: string
  board_type: BoardType
  role: Role
  rank: number
  employee_name: string | null
  units: number | null
}

export interface TrackingInfo {
  report_date: string
  owner_am: string | null
  owner_pm: string | null
  target_am: string | null
  target_pm: string | null
  shift: string | null
}

/** One hour of the Daily Tracking board's manually-entered cells. hour_index
 * (0-23) follows that board's own rolling day (0 = "10-11" ... 23 = "09-10"),
 * which starts at a different hour than fiege_hourly_data's hour_index. */
export interface TrackingRow {
  id?: string
  report_date: string
  hour_index: number
  spiders: string | null
  rebin_ops: string | null
  rebin_units: string | null
  rebin_uph: string | null
  admin_tl: string | null
  productive_hours: string | null
}
