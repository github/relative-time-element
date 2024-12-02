import DurationFormat from './duration-format-ponyfill.js'
import type {DurationFormatOptions} from './duration-format-ponyfill.js'
const durationRe = /^[-+]?P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
const durationRoundingThresholds = [Infinity, 11, 28, 21, 55, 55, 900]
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
  const actions: Array<() => void> = [
    () => {
      r.setUTCFullYear(r.getUTCFullYear() + duration.years)
    },
    () => {
      r.setUTCMonth(r.getUTCMonth() + duration.months)
    },
    () => {
      r.setUTCDate(r.getUTCDate() + duration.weeks * 7 + duration.days)
    },
    () => {
      r.setUTCHours(r.getUTCHours() + duration.hours)
    },
    () => {
      r.setUTCMinutes(r.getUTCMinutes() + duration.minutes)
    },
    () => {
      r.setUTCSeconds(r.getUTCSeconds() + duration.seconds)
    },
  ]
  if (duration.sign < 0) {
    actions.reverse()
  }
  for (const action of actions) action()
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
    precisionIndex >= 4 &&
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
  if (precisionIndex >= 2 && (months === 0 || days <= 26)) {
    if (precision === 'week' || days >= 6) return [Math.floor((days + 1) / 7) * sign, 'week']
    return [days * sign, 'day']
  }
  if (precision !== 'year' && (date.getFullYear() === now.getFullYear() || Math.abs(months) <= 6)) {
    return [months, 'month']
  }
  return [date.getFullYear() - now.getFullYear(), 'year']
}

interface RoundingOpts {
  relativeTo: Date | number
}

export function roundToSingleUnit(duration: Duration, {relativeTo = Date.now()}: Partial<RoundingOpts> = {}): Duration {
  return roundBalancedToSingleUnit(
    elapsedTime(applyDuration(new Date(relativeTo), duration), 'millisecond', relativeTo),
  )
}

export function roundBalancedToSingleUnit(duration: Duration): Duration {
  if (duration.blank) return duration
  const sign = duration.sign
  const values = [
    Math.abs(duration.years),
    Math.abs(duration.months),
    Math.abs(duration.days),
    Math.abs(duration.hours),
    Math.abs(duration.minutes),
    Math.abs(duration.seconds),
    Math.abs(duration.milliseconds),
  ]
  let biggestUnitIndex = values.findIndex(v => v > 0)
  const roundedLowerUnit =
    biggestUnitIndex < values.length - 1 &&
    values[biggestUnitIndex + 1] >= durationRoundingThresholds[biggestUnitIndex + 1]
  if (roundedLowerUnit) {
    values[biggestUnitIndex] += 1
  }
  if (values[biggestUnitIndex] >= durationRoundingThresholds[biggestUnitIndex]) {
    --biggestUnitIndex
    values[biggestUnitIndex] = 1
  }
  for (let i = biggestUnitIndex + 1; i < values.length; ++i) {
    values[i] = 0
  }
  if (biggestUnitIndex === 2 && values[2] >= 6) {
    const weeks = Math.max(1, Math.floor((values[2] + (roundedLowerUnit ? 0 : 1)) / 7))
    if (weeks < 4) {
      return new Duration(0, 0, weeks * sign)
    }
    values[biggestUnitIndex] = 0
    --biggestUnitIndex
    values[biggestUnitIndex] = 1
  }
  values[biggestUnitIndex] *= sign
  values.splice(2, 0, 0)
  return new Duration(...values)
}

export function getRoundedRelativeTimeUnit(rounded: Duration): [number, Intl.RelativeTimeFormatUnit] {
  if (rounded.blank) return [0, 'second']
  for (const unit of unitNames) {
    if (unit === 'millisecond') continue
    const val = rounded[`${unit}s` as keyof Duration] as number
    if (val) return [val, unit]
  }
  return [0, 'second']
}
