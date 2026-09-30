import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { emptyTrackingInfo, emptyTrackingRows } from '../lib/api'
import type { HourlyRow, LeaderboardEntry, ReportDay, TrackingInfo, TrackingRow } from '../lib/types'

export interface ReportDayData {
  day: ReportDay | null
  hourly: HourlyRow[]
  leaderboard: LeaderboardEntry[]
  trackingInfo: TrackingInfo
  trackingRows: TrackingRow[]
  loading: boolean
}

export function useReportDay(reportDate: string): ReportDayData {
  const [day, setDay] = useState<ReportDay | null>(null)
  const [hourly, setHourly] = useState<HourlyRow[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo>(() => emptyTrackingInfo(reportDate))
  const [trackingRows, setTrackingRows] = useState<TrackingRow[]>(() => emptyTrackingRows(reportDate))
  const [loaded, setLoaded] = useState(() => new Set<string>())

  useEffect(() => {
    setDay(null)
    setHourly([])
    setLeaderboard([])
    setTrackingInfo(emptyTrackingInfo(reportDate))
    setTrackingRows(emptyTrackingRows(reportDate))
    setLoaded(new Set())

    const markLoaded = (key: string) => setLoaded((prev) => new Set(prev).add(key))

    const unsubDay = onSnapshot(doc(db, 'reportDays', reportDate), (snap) => {
      setDay(snap.exists() ? (snap.data() as ReportDay) : null)
      markLoaded('day')
    })
    const unsubHourly = onSnapshot(doc(db, 'hourlyData', reportDate), (snap) => {
      setHourly(snap.exists() ? ((snap.data().rows as HourlyRow[]) ?? []) : [])
      markLoaded('hourly')
    })
    const unsubLeaderboard = onSnapshot(doc(db, 'leaderboardEntries', reportDate), (snap) => {
      setLeaderboard(snap.exists() ? ((snap.data().entries as LeaderboardEntry[]) ?? []) : [])
      markLoaded('leaderboard')
    })
    const unsubTrackingInfo = onSnapshot(doc(db, 'trackingInfo', reportDate), (snap) => {
      setTrackingInfo(snap.exists() ? (snap.data() as TrackingInfo) : emptyTrackingInfo(reportDate))
      markLoaded('trackingInfo')
    })
    const unsubTrackingRows = onSnapshot(doc(db, 'trackingRows', reportDate), (snap) => {
      setTrackingRows(snap.exists() ? ((snap.data().rows as TrackingRow[]) ?? []) : emptyTrackingRows(reportDate))
      markLoaded('trackingRows')
    })

    return () => {
      unsubDay()
      unsubHourly()
      unsubLeaderboard()
      unsubTrackingInfo()
      unsubTrackingRows()
    }
  }, [reportDate])

  const loading = loaded.size < 5
  return { day, hourly, leaderboard, trackingInfo, trackingRows, loading }
}
