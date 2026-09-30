import { Boxes, Package } from 'lucide-react'
import { PerformanceStatTile } from './PerformanceStatTile'
import { cumulativeStats, lastActiveHour, thresholdColor } from '../../lib/performance'
import { useClock } from '../../hooks/useClock'
import { formatClock } from '../../lib/date'
import type { HourlyRow } from '../../lib/types'

// Fixed shift targets — the original site doesn't expose a way to configure these either.
const PICK_UPMH_TARGET = 210
const PACK_UPMH_TARGET = 135

export function PerformanceView({ hourly }: { hourly: HourlyRow[] }) {
  const now = useClock()
  const last = lastActiveHour(hourly)
  const cumulative = cumulativeStats(hourly)

  return (
    <section className="grid min-h-0 grid-rows-2 gap-5">
      <div className="grid min-h-0 grid-cols-3 gap-5">
        <PerformanceStatTile
          icon={<Boxes className="h-8 w-8" />}
          title={`Pick UPMH · ${last.label}`}
          value={last.pickUpmh}
          unitLabel="units / man-hour"
          sub={last.slot ? `${last.slot} · target ${PICK_UPMH_TARGET}` : 'No data'}
          color={thresholdColor(last.pickUpmh, PICK_UPMH_TARGET, 'var(--fiege-red)')}
          live={last.isLive}
        />
        <PerformanceStatTile
          icon={<Package className="h-8 w-8" />}
          title={`Pack UPMH · ${last.label}`}
          value={last.packUpmh}
          unitLabel="units / man-hour"
          sub={last.slot ? `${last.slot} · target ${PACK_UPMH_TARGET}` : 'No data'}
          color={thresholdColor(last.packUpmh, PACK_UPMH_TARGET, 'var(--accent-cyan)')}
          live={last.isLive}
        />
        <PerformanceStatTile
          icon={<Package className="h-8 w-8" />}
          title={`Units Packed · ${last.label}`}
          value={last.packUnits}
          unitLabel="units"
          sub={last.slot ?? ''}
          color="var(--accent-amber)"
          live={last.isLive}
        />
      </div>
      <div className="grid min-h-0 grid-cols-3 gap-5">
        <PerformanceStatTile
          icon={<Boxes className="h-8 w-8" />}
          title="Pick UPMH · Cumulative"
          value={cumulative.pickUpmh}
          unitLabel="units / man-hour"
          sub={`as of ${formatClock(now)}`}
          color={thresholdColor(cumulative.pickUpmh, PICK_UPMH_TARGET, 'var(--fiege-red)')}
        />
        <PerformanceStatTile
          icon={<Package className="h-8 w-8" />}
          title="Pack UPMH · Cumulative"
          value={cumulative.packUpmh}
          unitLabel="units / man-hour"
          sub={`as of ${formatClock(now)}`}
          color={thresholdColor(cumulative.packUpmh, PACK_UPMH_TARGET, 'var(--accent-cyan)')}
        />
        <PerformanceStatTile
          icon={<Package className="h-8 w-8" />}
          title="Units Packed · Running Total"
          value={cumulative.packUnitsTotal}
          unitLabel="units"
          sub={`as of ${formatClock(now)}`}
          color="var(--accent-cyan)"
        />
      </div>
    </section>
  )
}
