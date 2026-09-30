import { Trophy, TrendingDown } from 'lucide-react'
import type { LeaderboardEntry, Role } from '../../lib/types'

export type BoardTheme = 'top5' | 'bottom5'

export function LeaderboardPanel({
  title,
  entries,
  theme = 'top5',
  color,
}: {
  title: string
  entries: LeaderboardEntry[]
  theme?: BoardTheme
  /** CSS color (var(...) or hex) driving the border, icon, title glow and non-medal row accents. */
  color: string
}) {
  const isFocus = theme === 'bottom5'
  const byRank = new Map(entries.map((e) => [e.rank, e]))
  const rows = [1, 2, 3, 4, 5].map((rank) => byRank.get(rank) ?? null)
  const medalColors = ['var(--medal-gold)', 'var(--medal-silver)', 'var(--medal-bronze)', color, color]
  const Icon = isFocus ? TrendingDown : Trophy

  return (
    <div
      className="panel sheen stagger-in flex min-h-0 flex-col p-5"
      style={{ borderColor: color, borderWidth: 2, borderTopWidth: 6 }}
    >
      <div className="mb-3 flex items-center gap-3">
        <Icon style={{ color }} className="h-9 w-9" strokeWidth={2.5} />
        <h3
          className="font-black tracking-widest uppercase"
          style={{
            color,
            fontSize: 'clamp(24px, 3.4vh, 44px)',
            textShadow: `0 0 30px color-mix(in oklab, ${color} 40%, transparent)`,
          }}
        >
          {title}
        </h3>
      </div>
      <div
        className="grid min-h-0 flex-1 gap-2"
        style={{ gridTemplateRows: 'repeat(5, minmax(0, 1fr))' }}
      >
        {rows.map((entry, i) => {
          const rowColor = isFocus ? (i === 0 ? 'var(--fiege-red)' : color) : medalColors[i]
          const hasData = !!entry?.employee_name
          return (
            <div
              key={i}
              className="stagger-in flex min-h-0 items-center gap-4 rounded-xl px-4"
              style={{
                background:
                  i === 0
                    ? `linear-gradient(90deg, color-mix(in oklab, ${rowColor} 26%, transparent), transparent 70%)`
                    : 'rgba(255,255,255,0.04)',
                border: `2px solid color-mix(in oklab, ${rowColor} ${i === 0 ? 55 : 22}%, transparent)`,
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div
                className="tabular flex shrink-0 items-center justify-center rounded-full font-black"
                style={{
                  width: 'clamp(44px, 6vh, 72px)',
                  height: 'clamp(44px, 6vh, 72px)',
                  background: rowColor,
                  color: 'var(--bg-primary)',
                  fontSize: 'clamp(18px, 2.4vh, 30px)',
                }}
              >
                #{i + 1}
              </div>
              <div
                className="min-w-0 flex-1 truncate font-black"
                style={{ fontSize: 'clamp(26px, 4vh, 54px)', color: 'var(--text-primary)' }}
                title={entry?.employee_name ?? ''}
              >
                {entry?.employee_name ?? '—'}
              </div>
              <div
                className="tabular shrink-0 font-black"
                style={{ color: rowColor, fontSize: 'clamp(30px, 4.6vh, 62px)' }}
              >
                {hasData ? (entry!.units ?? '--') : '--'}
              </div>
              <div
                className="shrink-0 text-xs font-bold tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                units
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Kept for callers that only know the picker/packer role — resolves the
// original site's per-column accent color.
export function roleColor(theme: BoardTheme, role: Role): string {
  if (theme === 'bottom5') return 'var(--focus-amber)'
  return role === 'picker' ? 'var(--fiege-red)' : 'var(--accent-cyan)'
}
