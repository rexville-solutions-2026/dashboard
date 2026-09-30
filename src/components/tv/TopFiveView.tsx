import { LeaderboardPanel, roleColor } from './LeaderboardPanel'
import { DEFAULT_BANNER } from '../../lib/constants'
import type { LeaderboardEntry, ReportDay } from '../../lib/types'

const BANNER_COLOR = 'var(--accent-amber)'

export function TopFiveView({ day, leaderboard }: { day: ReportDay | null; leaderboard: LeaderboardEntry[] }) {
  const pickers = leaderboard.filter((e) => e.board_type === 'top5' && e.role === 'picker')
  const packers = leaderboard.filter((e) => e.board_type === 'top5' && e.role === 'packer')
  const banner = day?.banner_message || DEFAULT_BANNER

  return (
    <>
      <div
        className="panel banner-pop flex items-center justify-center gap-4 overflow-hidden px-8 py-3"
        style={{
          borderColor: BANNER_COLOR,
          borderWidth: 2,
          background: `linear-gradient(90deg, color-mix(in oklab, ${BANNER_COLOR} 22%, var(--bg-panel)), var(--bg-panel) 60%, color-mix(in oklab, ${BANNER_COLOR} 22%, var(--bg-panel)))`,
        }}
      >
        <span
          className="text-center font-black tracking-widest uppercase"
          style={{
            fontSize: 'clamp(24px, 3.4vh, 46px)',
            color: 'var(--text-primary)',
            textShadow: `0 0 30px color-mix(in oklab, ${BANNER_COLOR} 40%, transparent)`,
          }}
        >
          {banner}
        </span>
      </div>
      <section className="grid min-h-0 grid-cols-2 gap-5">
        <LeaderboardPanel title="Top 5 Pickers" entries={pickers} theme="top5" color={roleColor('top5', 'picker')} />
        <LeaderboardPanel title="Top 5 Packers" entries={packers} theme="top5" color={roleColor('top5', 'packer')} />
      </section>
    </>
  )
}
