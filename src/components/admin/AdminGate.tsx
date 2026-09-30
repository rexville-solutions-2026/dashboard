import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { ADMIN_SESSION_KEY } from '../../lib/constants'

const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'fiege-admin'

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-red-500/40 bg-[var(--panel)] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <Lock size={26} />
        </div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide">Admin Access</h1>
        <p className="mt-1 mb-6 text-sm text-slate-400">Enter the admin password to manage the board.</p>
        <input
          autoFocus
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-center text-lg tracking-widest text-slate-100 outline-none focus:border-red-400"
        />
        {error && <p className="mt-2 text-sm text-red-400">Incorrect password.</p>}
        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-red-500 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition hover:bg-red-400"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}
