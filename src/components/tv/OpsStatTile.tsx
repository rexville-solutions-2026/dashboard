import type { ReactNode } from 'react'

export function OpsStatTile({
  icon,
  title,
  value,
  color,
  size = 'lg',
  delay = 0,
}: {
  icon: ReactNode
  title: string
  value: number | null
  color: string
  size?: 'lg' | 'sm'
  delay?: number
}) {
  return (
    <div
      className="panel ambient sheen stagger-in relative flex h-full min-h-0 flex-col justify-between overflow-hidden p-6"
      style={{
        borderColor: color,
        borderWidth: 2,
        borderTopWidth: 6,
        background: `linear-gradient(135deg, var(--bg-panel) 0%, color-mix(in oklab, ${color} 18%, var(--bg-panel)) 100%)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="relative z-10 flex items-center gap-4" style={{ color }}>
        {icon}
        <span
          className="font-black tracking-[0.18em] uppercase"
          style={{
            fontSize: size === 'sm' ? 'clamp(16px, 2.1vh, 28px)' : 'clamp(22px, 2.8vh, 38px)',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </span>
      </div>
      <div
        className="tabular relative z-10 text-center leading-none font-black"
        style={{
          fontSize: 'clamp(56px, 11.5vh, 190px)',
          color,
          textShadow: `0 0 60px color-mix(in oklab, ${color} 50%, transparent)`,
        }}
      >
        {value == null ? '--' : value.toLocaleString()}
      </div>
      <div
        className="relative z-10 text-right text-base font-black tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {value == null ? 'no data' : 'units'}
      </div>
    </div>
  )
}
