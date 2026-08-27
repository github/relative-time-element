import DurationFormat from './duration-format-ponyfill.js'
import type {DurationFormatOptions} from './duration-format-ponyfill.js'
import {createCache} from './intl-cache.js'
const durationRe = /^[-+]?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/

// `DurationFormat` normalizes its options on construction, so reuse one instance
// per (locale, options) combination rather than rebuilding it on every format.
const durationFormats = createCache<DurationFormat>()

// The option fields `DurationFormat` recognizes, in a fixed order. The cache key
// is built by reading only these fields so it is a faithful, semantic key: it
// ignores unrelated properties and never invokes caller-defined `toJSON`
// (unlike `JSON.stringify`), which would otherwise mis-key formatters or throw
// on circular structures for this public API.
const durationFormatOptionFields = [
  'style',
  'years',
  'yearsDisplay',
  'months',
  'monthsDisplay',
  'weeks',
  'weeksDisplay',
  'days',
  'daysDisplay',
  'hours',
  'hoursDisplay',
  'minutes',
  'minutesDisplay',
  'seconds',
  'secondsDisplay',
  'milliseconds',
  'millisecondsDisplay',
] as const

function durationFormatKey(locale: string, opts: DurationFormatOptions): string {
  let key = locale
  for (const field of durationFormatOptionFields) {
    key += `\u0000${opts[field] ?? ''}`
  }
  return key
}
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
    const key = durationFormatKey(locale, opts)
    let format = durationFormats.get(key)
    if (!format) durationFormats.set(key, (format = new DurationFormat(locale, opts)))
    return format.format(this)
  }
}

export function applyDuration(date: Date | number, duration: Duration): Date {
  const r = new Date(date)
  if (duration.sign < 0) {
    r.setUTCSeconds(r.getUTCSeconds() + duration.seconds)
    r.setUTCMinutes(r.getUTCMinutes() + duration.minutes)
    r.setUTCHours(r.getUTCHours() + duration.hours)
    r.setUTCDate(r.getUTCDate() + duration.weeks * 7 + duration.days)
    r.setUTCMonth(r.getUTCMonth() + duration.months)
    r.setUTCFullYear(r.getUTCFullYear() + duration.years)
  } else {
    r.setUTCFullYear(r.getUTCFullYear() + duration.years)
    r.setUTCMonth(r.getUTCMonth() + duration.months)
    r.setUTCDate(r.getUTCDate() + duration.weeks * 7 + duration.days)
    r.setUTCHours(r.getUTCHours() + duration.hours)
    r.setUTCMinutes(r.getUTCMinutes() + duration.minutes)
    r.setUTCSeconds(r.getUTCSeconds() + duration.seconds)
  }
  return r
}

/**
 * Applies a number of calendar months to a copy of the reference date.
 *
 * @param reference - Date from which to count.
 * @param months - Signed number of months to apply.
 * @returns The resulting date without modifying the reference.
 */
function applyCalendarMonths(reference: Date, months: number): Date {
  const result = new Date(reference)
  const referenceDay = result.getUTCDate()

  // Move from the first to avoid rolling an invalid date into the next month.
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const targetMonth = result.getUTCMonth()
  result.setUTCMonth(targetMonth + 1, 0)
  result.setUTCDate(Math.min(referenceDay, result.getUTCDate()))
  return result
}

/**
 * Checks whether two UTC times match through the requested precision.
 *
 * @param date - Date being compared.
 * @param reference - Reference date for the comparison.
 * @param precisionIndex - Index of the requested unit in {@link unitNames}.
 */
function hasSameTimeAtPrecision(date: Date, reference: Date, precisionIndex: number): boolean {
  if (precisionIndex <= unitNames.indexOf('day')) return true
  if (date.getUTCHours() !== reference.getUTCHours()) return false
  if (precisionIndex === unitNames.indexOf('hour')) return true
  if (date.getUTCMinutes() !== reference.getUTCMinutes()) return false
  if (precisionIndex === unitNames.indexOf('minute')) return true
  if (date.getUTCSeconds() !== reference.getUTCSeconds()) return false
  if (precisionIndex === unitNames.indexOf('second')) return true
  return date.getUTCMilliseconds() === reference.getUTCMilliseconds()
}

/**
 * Returns a calendar-based correction when fixed 30-day months produce an
 * incorrect year or when the dates align on a month or year boundary.
 *
 * @param date - Target date.
 * @param reference - Date from which elapsed time is measured.
 * @param precisionIndex - Index of the requested unit in {@link unitNames}.
 * @param estimatedYears - Year count produced by the fixed-duration estimate.
 * @returns The corrected duration, or `undefined` when no correction is needed.
 */
function calendarElapsedTime(
  date: Date,
  reference: Date,
  precisionIndex: number,
  estimatedYears: number,
): Duration | undefined {
  const calendarMonths =
    (date.getUTCFullYear() - reference.getUTCFullYear()) * 12 + date.getUTCMonth() - reference.getUTCMonth()

  // Anchor the candidate month count to the reference, then back it off if it
  // crossed the target. This prevents 30-day estimates from inventing a year.
  let wholeMonths = calendarMonths
  let anchor = applyCalendarMonths(reference, calendarMonths)
  const candidateAligned =
    anchor.getUTCFullYear() === date.getUTCFullYear() &&
    anchor.getUTCMonth() === date.getUTCMonth() &&
    anchor.getUTCDate() === date.getUTCDate() &&
    hasSameTimeAtPrecision(date, anchor, precisionIndex)
  const candidateOvershot = !candidateAligned && (calendarMonths > 0 ? anchor > date : anchor < date)
  if (candidateOvershot) {
    wholeMonths += calendarMonths > 0 ? -1 : 1
    anchor = applyCalendarMonths(reference, wholeMonths)
  }

  const calendarYears = Math.trunc(wholeMonths / 12)
  const hasYearScaleDuration = estimatedYears !== 0 || calendarYears !== 0
  const isCalendarAligned =
    anchor.getUTCFullYear() === date.getUTCFullYear() &&
    anchor.getUTCMonth() === date.getUTCMonth() &&
    anchor.getUTCDate() === date.getUTCDate() &&
    hasSameTimeAtPrecision(date, anchor, precisionIndex)
  if (!hasYearScaleDuration && !isCalendarAligned) return

  // Calendar-aligned durations omit only units below the requested precision.
  // Other corrected durations retain the remainder after the month anchor.
  const sign = Math.sign(date.getTime() - reference.getTime())
  const remainder = isCalendarAligned ? 0 : Math.abs(date.getTime() - anchor.getTime())
  const seconds = Math.floor(remainder / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let years = 0
  let months = 0
  const durationMonths = isCalendarAligned ? calendarMonths : wholeMonths
  const durationYears = Math.trunc(durationMonths / 12)
  if (precisionIndex >= unitNames.indexOf('year')) years = durationYears
  if (precisionIndex >= unitNames.indexOf('month')) months = durationMonths - durationYears * 12
  return new Duration(
    years,
    months,
    0,
    precisionIndex >= unitNames.indexOf('day') ? days * sign : 0,
    precisionIndex >= unitNames.indexOf('hour') ? (hours - days * 24) * sign : 0,
    precisionIndex >= unitNames.indexOf('minute') ? (minutes - hours * 60) * sign : 0,
    precisionIndex >= unitNames.indexOf('second') ? (seconds - minutes * 60) * sign : 0,
    precisionIndex >= unitNames.indexOf('millisecond') ? (remainder - seconds * 1000) * sign : 0,
  )
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
  const i = unitNames.indexOf(precision)

  const nowDate = new Date(now)
  const calendarDuration = calendarElapsedTime(date, nowDate, i, year * sign)
  if (calendarDuration) return calendarDuration

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
