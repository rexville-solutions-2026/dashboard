import { Logo } from './Logo'
import { HeaderClock } from './HeaderClock'
import { HeaderActions } from './HeaderActions'

/**
 * The header strip shared by every rotating board: logo on the left, the
 * fixed "Live Warehouse Dashboard" title centered, and the clock plus
 * action buttons on the right — matching the original site's 3-column
 * grid header exactly.
 */
export function BoardHeader() {
  return (
    <header
      className="brand-rail stagger-in panel relative grid min-h-0 items-center gap-4 overflow-hidden px-8 py-3"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2.2fr) minmax(0,1fr)' }}
    >
      <div className="z-10 flex items-center gap-4">
        <Logo size={128} />
      </div>
      <div className="pointer-events-none min-w-0 text-center">
        <div
          className="truncate leading-none font-black tracking-tight uppercase"
          style={{ letterSpacing: '0.04em', fontSize: 'clamp(24px, 3.4vh, 44px)' }}
        >
          Live Warehouse Dashboard
        </div>
      </div>
      <div className="z-10 flex items-center justify-end gap-6">
        <HeaderClock />
        <HeaderActions />
      </div>
    </header>
  )
}
