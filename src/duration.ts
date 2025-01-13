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

export function elapsedTime(date: Date, precision: Unit = 'second', now = Date.now()): Duration {
  const delta = date.getTime() - now
  if (delta === 0) return new Duration()
  const sign = Math.sign(delta)
  const ms = Math.abs(delta)
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const month = Math.floor(day / 30)
  const year = Math.floor(month / 12)
  const i = unitNames.indexOf(precision) || unitNames.length
  return new Duration(
    i >= 0 ? year * sign : 0,
    i >= 1 ? (month - year * 12) * sign : 0,
    0,
    i >= 3 ? (day - month * 30) * sign : 0,
    i >= 4 ? (hr - day * 24) * sign : 0,
    i >= 5 ? (min - hr * 60) * sign : 0,
    i >= 6 ? (sec - min * 60) * sign : 0,
    i >= 7 ? (ms - sec * 1000) * sign : 0,
  )
}

const durationRoundingThresholds = [
  Infinity, // Year
  11, // Month
  28, // Day
  21, // Hour
  55, // Minute
  55, // Second
  900, // Millisecond
]

interface RoundingOpts {
  relativeTo: Date | number
}

export function roundToSingleUnit(duration: Duration, {relativeTo = Date.now()}: Partial<RoundingOpts> = {}): Duration {
  if (duration.blank) return duration
  const referenceDate = new Date(relativeTo)
  const specifiedDate = applyDuration(referenceDate, duration)
  const [sign, subtrahend, minuend] =
    specifiedDate < referenceDate ? [-1, referenceDate, specifiedDate] : [1, specifiedDate, referenceDate]
  const subtrahendWithoutTime = new Date(subtrahend)
  subtrahendWithoutTime.setHours(0)
  subtrahendWithoutTime.setMinutes(0)
  subtrahendWithoutTime.setSeconds(0)
  subtrahendWithoutTime.setMilliseconds(0)
  const minuendWithoutTime = new Date(minuend)
  minuendWithoutTime.setHours(0)
  minuendWithoutTime.setMinutes(0)
  minuendWithoutTime.setSeconds(0)
  minuendWithoutTime.setMilliseconds(0)
  if (
    subtrahendWithoutTime.getTime() === minuendWithoutTime.getTime() ||
    subtrahend.getTime() - minuend.getTime() < 1000 * 60 * 60 * 12
  ) {
    const difference = Math.round((subtrahend.getTime() - minuend.getTime()) / 1000)
    let hours = Math.floor(difference / 3600)
    let minutes = Math.floor((difference % 3600) / 60)
    const seconds = Math.floor(difference % 60)
    if (hours === 0) {
      if (seconds >= durationRoundingThresholds[5]) minutes += 1
      if (minutes >= durationRoundingThresholds[4]) {
        return new Duration(0, 0, 0, 0, 1 * sign) // 1 hour.
      }
      if (minutes === 0) {
        return new Duration(0, 0, 0, 0, 0, 0, seconds * sign)
      } else {
        return new Duration(0, 0, 0, 0, 0, minutes * sign)
      }
    } else {
      if (hours < 23 && minutes >= durationRoundingThresholds[4]) hours += 1
      return new Duration(0, 0, 0, 0, hours * sign)
    }
  }
  const days = Math.round((subtrahendWithoutTime.getTime() - minuendWithoutTime.getTime()) / (1000 * 60 * 60 * 24))
  const months =
    subtrahend.getFullYear() * 12 + subtrahend.getMonth() - (minuend.getFullYear() * 12 + minuend.getMonth())
  if (months === 0 || days <= 26) {
    if (days >= 6) {
      return new Duration(0, 0, Math.floor((days + 1) / 7) * sign) // Weeks.
    } else {
      return new Duration(0, 0, 0, days * sign)
    }
  }
  if (months < 12) {
    return new Duration(0, months * sign)
  } else {
    return new Duration((subtrahend.getFullYear() - minuend.getFullYear()) * sign)
  }
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
