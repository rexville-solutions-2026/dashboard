import { LeaderboardPanel, roleColor } from './LeaderboardPanel'
import type { LeaderboardEntry } from '../../lib/types'

const BOTTOM_FIVE_BANNER = "Every hour is a fresh start — push on, you've got this!"
const BANNER_COLOR = 'var(--focus-amber)'

export function BottomFiveView({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const pickers = leaderboard.filter((e) => e.board_type === 'bottom5' && e.role === 'picker')
  const packers = leaderboard.filter((e) => e.board_type === 'bottom5' && e.role === 'packer')

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
          {BOTTOM_FIVE_BANNER}
        </span>
      </div>
      <section className="grid min-h-0 grid-cols-2 gap-5">
        <LeaderboardPanel title="Bottom 5 Pickers" entries={pickers} theme="bottom5" color={roleColor('bottom5', 'picker')} />
        <LeaderboardPanel title="Bottom 5 Packers" entries={packers} theme="bottom5" color={roleColor('bottom5', 'packer')} />
      </section>
    </>
  )
}
