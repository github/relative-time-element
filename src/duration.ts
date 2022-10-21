const duration = /^[-+]?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

export const isDuration = (str: string) => duration.test(str)

export function applyDuration(date: Date, str: string): Date | null {
  const r = new Date(date)
  str = String(str).trim()
  const factor = str.startsWith('-') ? -1 : 1
  const parsed = String(str)
    .trim()
    .match(duration)
    ?.slice(1)
    .map(x => (Number(x) || 0) * factor)
  if (!parsed) return null
  const [years, months, weeks, days, hours, minutes, seconds] = parsed

  r.setFullYear(r.getFullYear() + years)
  r.setMonth(r.getMonth() + months)
  r.setDate(r.getDate() + weeks * 7 + days)
  r.setHours(r.getHours() + hours)
  r.setMinutes(r.getMinutes() + minutes)
  r.setSeconds(r.getSeconds() + seconds)
  return r
}

export function withinDuration(a: Date, b: Date, str: string): boolean {
  const absStr = str.replace(/^[-+]/, '')
  const sign = a < b ? '-' : ''
  const threshold = applyDuration(a, `${sign}${absStr}`)
  if (!threshold) return true
  return Math.abs(Number(threshold) - Number(a)) > Math.abs(Number(a) - Number(b))
}
