export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateBadge(d: Date): string {
  return d
    .toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' })
    .toUpperCase()
    .replace(',', '')
}
