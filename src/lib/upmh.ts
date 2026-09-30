export function computeRate(units: number | null | undefined, hours: number | null | undefined): number | null {
  if (units === null || units === undefined) return null
  if (!hours) return null
  const val = units / hours
  return Math.round(val * 10) / 10
}

export function sum(values: Array<number | null | undefined>): number {
  return values.reduce((acc: number, v) => acc + (v ?? 0), 0)
}
