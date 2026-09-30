import { Boxes, Package, TriangleAlert, Clock, Layers } from 'lucide-react'
import { OpsStatTile } from './OpsStatTile'
import type { ReportDay } from '../../lib/types'

export function OperationsView({ day }: { day: ReportDay | null }) {
  return (
    <section className="grid min-h-0 grid-cols-6 gap-5" style={{ gridTemplateRows: '1fr 1fr' }}>
      <div className="col-span-3 min-h-0">
        <OpsStatTile
          title="Units to Pick"
          value={day?.units_to_pick ?? null}
          color="var(--fiege-red)"
          icon={<Boxes className="h-12 w-12" />}
          delay={0}
        />
      </div>
      <div className="col-span-3 min-h-0">
        <OpsStatTile
          title="Units to Pack"
          value={day?.units_to_pack ?? null}
          color="var(--accent-cyan)"
          icon={<Package className="h-12 w-12" />}
          delay={80}
        />
      </div>
      <div className="col-span-2 min-h-0">
        <OpsStatTile
          title="Pre Processed Failed"
          value={day?.pre_processed_failed ?? null}
          color="var(--accent-amber)"
          icon={<TriangleAlert className="h-10 w-10" />}
          size="sm"
          delay={160}
        />
      </div>
      <div className="col-span-2 min-h-0">
        <OpsStatTile
          title="Backlog Orders"
          value={day?.backlog_orders ?? null}
          color="var(--fiege-red)"
          icon={<Clock className="h-10 w-10" />}
          size="sm"
          delay={240}
        />
      </div>
      <div className="col-span-2 min-h-0">
        <OpsStatTile
          title="Overpicks"
          value={day?.overpicks ?? null}
          color="var(--accent-amber)"
          icon={<Layers className="h-10 w-10" />}
          size="sm"
          delay={320}
        />
      </div>
    </section>
  )
}
