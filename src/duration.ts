import DurationFormat from './duration-format-ponyfill.js'
import type {DurationFormatOptions} from './duration-format-ponyfill.js'
const durationRe = /^[-+]?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
export const unitNames = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'] as const
export type Unit = typeof unitNames[number]

export const isDuration = (str: string) => durationRe.test(str)
type Sign = -1 | 0 | 1

// https://tc39.es/proposal-temporal/docs/duration.html
export class Duration {
  readonly sign: Sign
  readonly blank: boolean

  constructor(
    public readonly years = 0,
    public readonly months = 0,
    public readonly weeks = 0,
    public readonly days = 0,
    public readonly hours = 0,
    public readonly minutes = 0,
    public readonly seconds = 0,
    public readonly milliseconds = 0,
  ) {
    // Account for -0
    this.years ||= 0
    this.sign ||= Math.sign(this.years) as Sign
    this.months ||= 0
    this.sign ||= Math.sign(this.months) as Sign
    this.weeks ||= 0
    this.sign ||= Math.sign(this.weeks) as Sign
    this.days ||= 0
    this.sign ||= Math.sign(this.days) as Sign
    this.hours ||= 0
    this.sign ||= Math.sign(this.hours) as Sign
    this.minutes ||= 0
    this.sign ||= Math.sign(this.minutes) as Sign
    this.seconds ||= 0
    this.sign ||= Math.sign(this.seconds) as Sign
    this.milliseconds ||= 0
    this.sign ||= Math.sign(this.milliseconds) as Sign
    this.blank = this.sign === 0
  }

  abs() {
    return new Duration(
      Math.abs(this.years),
      Math.abs(this.months),
      Math.abs(this.weeks),
      Math.abs(this.days),
      Math.abs(this.hours),
      Math.abs(this.minutes),
      Math.abs(this.seconds),
      Math.abs(this.milliseconds),
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
      const {years, months, weeks, days, hours, minutes, seconds, milliseconds} = durationLike as Record<string, number>
      return new Duration(years, months, weeks, days, hours, minutes, seconds, milliseconds)
    }
    throw new RangeError('invalid duration')
  }

  static compare(one: unknown, two: unknown): -1 | 0 | 1 {
    const now = Date.now()
    const oneApplied = Math.abs(applyDuration(now, Duration.from(one)).getTime() - now)
    const twoApplied = Math.abs(applyDuration(now, Duration.from(two)).getTime() - now)
    return oneApplied > twoApplied ? -1 : oneApplied < twoApplied ? 1 : 0
  }

  toLocaleString(locale: string, opts: DurationFormatOptions) {
    return new DurationFormat(locale, opts).format(this)
  }
}

export function applyDuration(date: Date | number, duration: Duration): Date {
  const r = new Date(date)
  r.setFullYear(r.getFullYear() + duration.years)
  r.setMonth(r.getMonth() + duration.months)
  r.setDate(r.getDate() + duration.weeks * 7 + duration.days)
  r.setHours(r.getHours() + duration.hours)
  r.setMinutes(r.getMinutes() + duration.minutes)
  r.setSeconds(r.getSeconds() + duration.seconds)
  return r
}

// Calculates the elapsed time from `now` to `date`.
export function elapsedTime(
  date: Date,
  precision: Unit = 'second',
  nowTimestamp: Date | number = Date.now(),
): Duration {
  const now = new Date(nowTimestamp)
  // eslint-disable-next-line prefer-const
  let [sign, subtrahend, minuend] = date < now ? [-1, now, date] : [1, date, now]
  let ms: number
  let sec: number
  let min: number
  let hr: number
  let day: number
  let month: number
  let year: number
  // Using UTC to avoid timezone-specific variations.
  if (subtrahend.getUTCMilliseconds() >= minuend.getUTCMilliseconds()) {
    ms = subtrahend.getUTCMilliseconds() - minuend.getUTCMilliseconds()
  } else {
    ms = 1000 + subtrahend.getUTCMilliseconds() - minuend.getUTCMilliseconds()
    subtrahend = new Date(subtrahend.getTime() - 1000)
  }

  if (subtrahend.getUTCSeconds() >= minuend.getUTCSeconds()) {
    sec = subtrahend.getUTCSeconds() - minuend.getUTCSeconds()
  } else {
    sec = 60 + subtrahend.getUTCSeconds() - minuend.getUTCSeconds()
    subtrahend = new Date(subtrahend.getTime() - 1000 * 60)
  }

  if (subtrahend.getUTCMinutes() >= minuend.getUTCMinutes()) {
    min = subtrahend.getUTCMinutes() - minuend.getUTCMinutes()
  } else {
    min = 60 + subtrahend.getUTCMinutes() - minuend.getUTCMinutes()
    subtrahend = new Date(subtrahend.getTime() - 1000 * 60 * 60)
  }

  if (subtrahend.getUTCHours() >= minuend.getUTCHours()) {
    hr = subtrahend.getUTCHours() - minuend.getUTCHours()
  } else {
    hr = 24 + subtrahend.getUTCHours() - minuend.getUTCHours()
    subtrahend = new Date(subtrahend.getTime() - 1000 * 60 * 60 * 24)
  }

  if (subtrahend.getUTCDate() >= minuend.getUTCDate()) {
    day = subtrahend.getUTCDate() - minuend.getUTCDate()
  } else {
    day = subtrahend.getUTCDate()
    subtrahend = new Date(subtrahend.getTime() - 1000 * 60 * 60 * 24 * day)
    day += Math.max(0, subtrahend.getUTCDate() - minuend.getUTCDate())
  }

  year = subtrahend.getUTCFullYear() - minuend.getUTCFullYear()
  if (subtrahend.getUTCMonth() >= minuend.getUTCMonth()) {
    month = subtrahend.getUTCMonth() - minuend.getUTCMonth()
  } else {
    month = 12 + subtrahend.getUTCMonth() - minuend.getUTCMonth()
    year -= 1
  }

  let precisionIndex = unitNames.indexOf(precision)
  if (precisionIndex === -1) {
    precisionIndex = unitNames.length
  }
  return new Duration(
    precisionIndex >= 0 ? year * sign : 0,
    precisionIndex >= 1 ? month * sign : 0,
    0,
    precisionIndex >= 3 ? day * sign : 0,
    precisionIndex >= 4 ? hr * sign : 0,
    precisionIndex >= 5 ? min * sign : 0,
    precisionIndex >= 6 ? sec * sign : 0,
    precisionIndex >= 7 ? ms * sign : 0,
  )
}

interface RoundingOpts {
  relativeTo: Date | number
}

export function roundToSingleUnit(duration: Duration, {relativeTo = Date.now()}: Partial<RoundingOpts> = {}): Duration {
  relativeTo = new Date(relativeTo)
  if (duration.blank) return duration
  const sign = duration.sign
  let years = Math.abs(duration.years)
  let months = Math.abs(duration.months)
  let weeks = Math.abs(duration.weeks)
  let days = Math.abs(duration.days)
  let hours = Math.abs(duration.hours)
  let minutes = Math.abs(duration.minutes)
  let seconds = Math.abs(duration.seconds)
  let milliseconds = Math.abs(duration.milliseconds)

  if (milliseconds >= 900) seconds += Math.round(milliseconds / 1000)
  if (seconds || minutes || hours || days || weeks || months || years) {
    milliseconds = 0
  }

  if (seconds >= 55) minutes += Math.round(seconds / 60)
  if (minutes || hours || days || weeks || months || years) seconds = 0

  if (minutes >= 55) hours += Math.round(minutes / 60)
  if (hours || days || weeks || months || years) minutes = 0

  if (days && hours >= 12) days += Math.round(hours / 24)
  if (!days && hours >= 21) days += Math.round(hours / 24)
  if (days || weeks || months || years) hours = 0

  // Resolve calendar dates
  const currentYear = relativeTo.getFullYear()
  const currentMonth = relativeTo.getMonth()
  const currentDate = relativeTo.getDate()
  if (days >= 27 || years + months + days) {
    const newMonthDate = new Date(relativeTo)
    newMonthDate.setDate(1)
    newMonthDate.setMonth(currentMonth + months * sign + 1)
    newMonthDate.setDate(0)
    const monthDateCorrection = Math.max(0, currentDate - newMonthDate.getDate())

    const newDate = new Date(relativeTo)
    newDate.setFullYear(currentYear + years * sign)
    newDate.setDate(currentDate - monthDateCorrection)
    newDate.setMonth(currentMonth + months * sign)
    newDate.setDate(currentDate - monthDateCorrection + days * sign)
    const yearDiff = newDate.getFullYear() - relativeTo.getFullYear()
    const monthDiff = newDate.getMonth() - relativeTo.getMonth()
    const daysDiff = Math.abs(Math.round((Number(newDate) - Number(relativeTo)) / 86400000)) + monthDateCorrection
    const monthsDiff = Math.abs(yearDiff * 12 + monthDiff)
    if (daysDiff < 27) {
      if (days >= 6) {
        weeks += Math.round(days / 7)
        days = 0
      } else {
        days = daysDiff
      }
      months = years = 0
    } else if (monthsDiff <= 11) {
      months = monthsDiff
      years = 0
    } else {
      months = 0
      years = yearDiff * sign
    }
    if (months || years) days = 0
  }
  if (years) months = 0

  if (weeks >= 4) months += Math.round(weeks / 4)
  if (months || years) weeks = 0
  if (days && weeks && !months && !years) {
    weeks += Math.round(days / 7)
    days = 0
  }

  return new Duration(
    years * sign,
    months * sign,
    weeks * sign,
    days * sign,
    hours * sign,
    minutes * sign,
    seconds * sign,
    milliseconds * sign,
  )
}

export function getRelativeTimeUnit(
  duration: Duration,
  opts?: Partial<RoundingOpts>,
): [number, Intl.RelativeTimeFormatUnit] {
  const rounded = roundToSingleUnit(duration, opts)
  if (rounded.blank) return [0, 'second']
  for (const unit of unitNames) {
    if (unit === 'millisecond') continue
    const val = rounded[`${unit}s` as keyof Duration] as number
    if (val) return [val, unit]
  }
  return [0, 'second']
}
