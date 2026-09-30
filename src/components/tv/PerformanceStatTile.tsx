import type { ReactNode } from 'react'

export function PerformanceStatTile({
  icon,
  title,
  value,
  unitLabel,
  sub,
  color,
  live,
}: {
  icon: ReactNode
  title: string
  value: number | null
  unitLabel: string
  sub: string
  color: string
  live?: boolean
}) {
  return (
    <div
      className="panel ambient sheen stagger-in relative flex flex-col justify-between overflow-hidden px-6 py-3"
      style={{
        borderColor: color,
        borderWidth: 2,
        borderTopWidth: 4,
        background: `linear-gradient(135deg, var(--bg-panel) 0%, color-mix(in oklab, ${color} 14%, var(--bg-panel)) 100%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3" style={{ color }}>
          {icon}
          <span
            className="text-base font-black tracking-[0.18em] uppercase lg:text-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            {title}
          </span>
        </div>
        {live && <span className="live-dot" style={{ background: color }} />}
      </div>
      <div
        className="tabular leading-none font-black"
        style={{
          fontSize: 'clamp(56px, 8.5vh, 110px)',
          color,
          textShadow: `0 0 40px color-mix(in oklab, ${color} 45%, transparent)`,
        }}
      >
        {value == null ? '--' : value.toLocaleString()}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-base font-black tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          {unitLabel}
        </span>
        {sub && (
          <span className="tabular text-base font-bold" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}
