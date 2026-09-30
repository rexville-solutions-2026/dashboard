export const DEFAULT_BANNER = 'Well done team — outstanding work, keep it up!'

export const HOUR_SLOTS: string[] = Array.from({ length: 24 }, (_, i) => {
  const start = (6 + i) % 24
  const end = (7 + i) % 24
  const fmt = (h: number) => h.toString().padStart(2, '0') + ':00'
  return `${fmt(start)}-${fmt(end)}`
})

export const ADMIN_SESSION_KEY = 'fiege_admin_unlocked'
