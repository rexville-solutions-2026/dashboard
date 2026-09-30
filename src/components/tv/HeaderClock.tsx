import { useClock } from '../../hooks/useClock'
import { formatClock } from '../../lib/date'

export function HeaderClock() {
  const now = useClock()
  return (
    <div className="tabular flex flex-col justify-center text-right">
      <div className="text-5xl leading-none font-black" style={{ color: 'var(--accent-cyan)' }}>
        {formatClock(now)}
      </div>
      <div
        className="mt-1 text-base leading-none font-black tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}
      </div>
    </div>
  )
}
