import type { HourlyRow } from './types'
import { computeRate, sum } from './upmh'

export interface HourStats {
  slot: string | null
  pickUpmh: number | null
  packUpmh: number | null
  packUnits: number | null
  isLive: boolean
  label: 'Now' | 'Last hour' | 'No data'
}

export interface CumulativeStats {
  pickUpmh: number | null
  packUpmh: number | null
  packUnitsTotal: number
}

/** The warehouse "hour index" for a given moment — the shift day starts at 06:00. */
export function currentHourIndex(d = new Date()): number {
  return (d.getHours() - 6 + 24) % 24
}

/** The most recent hour that has any pick or pack units logged. */
export function lastActiveHour(hourly: HourlyRow[]): HourStats {
  const active = [...hourly].reverse().find((r) => r.pick_units != null || r.pack_units != null)
  if (!active) return { slot: null, pickUpmh: null, packUpmh: null, packUnits: null, isLive: false, label: 'No data' }
  const isLive = active.hour_index === currentHourIndex()
  return {
    slot: active.hour_slot,
    pickUpmh: computeRate(active.pick_units, active.pick_hours),
    packUpmh: computeRate(active.pack_units, active.pack_hours),
    packUnits: active.pack_units ?? null,
    isLive,
    label: isLive ? 'Now' : 'Last hour',
  }
}

/** Green when a value meets/beats its target, red when it falls short, and the fallback color when there's no data yet. */
export function thresholdColor(value: number | null, target: number, fallback: string): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return fallback
  return value >= target ? 'var(--success-green)' : 'var(--danger)'
}

export function cumulativeStats(hourly: HourlyRow[]): CumulativeStats {
  const pickUnits = sum(hourly.map((r) => r.pick_units))
  const packUnits = sum(hourly.map((r) => r.pack_units))
  const pickHours = sum(hourly.map((r) => r.pick_hours))
  const packHours = sum(hourly.map((r) => r.pack_hours))
  return {
    pickUpmh: computeRate(pickUnits, pickHours),
    packUpmh: computeRate(packUnits, packHours),
    packUnitsTotal: packUnits,
  }
}
