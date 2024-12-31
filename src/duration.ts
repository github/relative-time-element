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

export function relativeTime(
  date: Date,
  precision: Unit = 'second',
  nowTimestamp: Date | number = Date.now(),
): [number, Intl.RelativeTimeFormatUnit] {
  let precisionIndex = unitNames.indexOf(precision)
  if (precisionIndex === -1) {
    precisionIndex = unitNames.length
  }
  const now = new Date(nowTimestamp)
  const sign = Math.sign(date.getTime() - now.getTime())
  const dateWithoutTime = new Date(date)
  dateWithoutTime.setHours(0)
  dateWithoutTime.setMinutes(0)
  dateWithoutTime.setSeconds(0)
  dateWithoutTime.setMilliseconds(0)
  const nowWithoutTime = new Date(now)
  nowWithoutTime.setHours(0)
  nowWithoutTime.setMinutes(0)
  nowWithoutTime.setSeconds(0)
  nowWithoutTime.setMilliseconds(0)
  if (
    precisionIndex >= 4 && // At least hour.
    (dateWithoutTime.getTime() === nowWithoutTime.getTime() ||
      Math.abs(date.getTime() - now.getTime()) < 1000 * 60 * 60 * 12)
  ) {
    const difference = Math.round(((date.getTime() - now.getTime()) / 1000) * sign)
    let hours = Math.floor(difference / 3600)
    let minutes = Math.floor((difference % 3600) / 60)
    const seconds = Math.floor(difference % 60)
    if (hours === 0) {
      if (seconds >= durationRoundingThresholds[5]) minutes += 1
      if (minutes >= durationRoundingThresholds[4]) return [sign, 'hour']
      if (precision === 'hour') return [0, 'hour']
      if (minutes === 0 && precisionIndex >= 6) return [seconds * sign, 'second']
      return [minutes * sign, 'minute']
    } else {
      if (hours < 23 && minutes >= durationRoundingThresholds[4]) hours += 1
      return [hours * sign, 'hour']
    }
  }
  const days = Math.round(((dateWithoutTime.getTime() - nowWithoutTime.getTime()) / (1000 * 60 * 60 * 24)) * sign)
  const months = date.getFullYear() * 12 + date.getMonth() - (now.getFullYear() * 12 + now.getMonth())
  if (
    precisionIndex >= 2 && // At least week.
    (months === 0 || days <= 26)
  ) {
    if (precision === 'week' || days >= 6) return [Math.floor((days + 1) / 7) * sign, 'week']
    return [days * sign, 'day']
  }
  if (precision !== 'year' && Math.abs(months) < 12) {
    return [months, 'month']
  }
  return [date.getFullYear() - now.getFullYear(), 'year']
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
