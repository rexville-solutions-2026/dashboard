import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Maximize2, Minimize2, Lock } from 'lucide-react'

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

export function HeaderActions() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggleFullscreen}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black tracking-widest uppercase transition hover:scale-105"
        style={{ background: 'var(--accent-cyan)', color: 'var(--bg-primary)' }}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        {isFullscreen ? 'Exit' : 'Full Screen'}
      </button>
      <Link
        to="/admin"
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black tracking-widest uppercase transition hover:scale-105"
        style={{ background: 'var(--fiege-red)', color: 'var(--bg-primary)' }}
      >
        <Lock className="h-4 w-4" />
        Admin
      </Link>
    </div>
  )
}
