const durationRe = /^[-+]?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

export const isDuration = (str: string) => durationRe.test(str)

export class Duration {
  constructor(
    public years = 0,
    public months = 0,
    public weeks = 0,
    public days = 0,
    public hours = 0,
    public minutes = 0,
    public seconds = 0,
  ) {}

  abs() {
    return new Duration(
      Math.abs(this.years),
      Math.abs(this.months),
      Math.abs(this.weeks),
      Math.abs(this.days),
      Math.abs(this.hours),
      Math.abs(this.minutes),
      Math.abs(this.seconds),
    )
  }

  static from(durationLike: unknown): Duration {
    if (typeof durationLike === 'string') {
      const str = String(durationLike).trim()
      const factor = str.startsWith('-') ? -1 : 1
      const parsed = str
        .match(durationRe)
        ?.slice(1)
        .map(x => (Number(x) || 0) * factor)
      if (!parsed) return new Duration()
      return new Duration(...parsed)
    } else if (typeof durationLike === 'object') {
      const {years, months, weeks, days, hours, minutes, seconds} = durationLike as Record<string, number>
      return new Duration(years, months, weeks, days, hours, minutes, seconds)
    }
    throw new RangeError('invalid duration')
  }
}

export function applyDuration(date: Date, duration: Duration): Date | null {
  const r = new Date(date)
  r.setFullYear(r.getFullYear() + duration.years)
  r.setMonth(r.getMonth() + duration.months)
  r.setDate(r.getDate() + duration.weeks * 7 + duration.days)
  r.setHours(r.getHours() + duration.hours)
  r.setMinutes(r.getMinutes() + duration.minutes)
  r.setSeconds(r.getSeconds() + duration.seconds)
  return r
}

export function withinDuration(a: Date, b: Date, str: string): boolean {
  const duration = Duration.from(str).abs()
  const threshold = applyDuration(a, duration)
  if (!threshold) return true
  return Math.abs(Number(threshold) - Number(a)) > Math.abs(Number(a) - Number(b))
}
