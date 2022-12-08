import type {Duration} from './duration.js'

class ListFormatPonyFill {
  formatToParts(members: Iterable<string>) {
    const parts: DurationPart[] = []
    for (const value of members) {
      parts.push({type: 'element', value})
      parts.push({type: 'literal', value: ', '})
    }
    return parts.slice(0, -1)
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ListFormat = (typeof Intl !== 'undefined' && (Intl as any).ListFormat) || ListFormatPonyFill

// https://tc39.es/proposal-intl-duration-format/
interface DurationFormatResolvedOptions {
  locale: string
  style: 'long' | 'short' | 'narrow' | 'digital'
  years: 'long' | 'short' | 'narrow'
  yearsDisplay: 'always' | 'auto'
  months: 'long' | 'short' | 'narrow'
  monthsDisplay: 'always' | 'auto'
  weeks: 'long' | 'short' | 'narrow'
  weeksDisplay: 'always' | 'auto'
  days: 'long' | 'short' | 'narrow'
  daysDisplay: 'always' | 'auto'
  hours: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  hoursDisplay: 'always' | 'auto'
  minutes: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  minutesDisplay: 'always' | 'auto'
  seconds: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit'
  secondsDisplay: 'always' | 'auto'
  milliseconds: 'long' | 'short' | 'narrow' | 'numeric'
  millisecondsDisplay: 'always' | 'auto'
}

export type DurationFormatOptions = Partial<Omit<DurationFormatResolvedOptions, 'locale'>>

const partsTable = [
  ['years', 'year'],
  ['months', 'month'],
  ['weeks', 'week'],
  ['days', 'day'],
  ['hours', 'hour'],
  ['minutes', 'minute'],
  ['seconds', 'second'],
  ['milliseconds', 'millisecond'],
] as const

interface DurationPart {
  type: 'integer' | 'literal' | 'element'
  value: string
}

const twoDigitFormatOptions = {minimumIntegerDigits: 2}

export default class DurationFormat {
  #options: DurationFormatResolvedOptions

  constructor(locale: string, options: DurationFormatOptions = {}) {
    let style = String(options.style || 'short') as DurationFormatResolvedOptions['style']
    if (style !== 'long' && style !== 'short' && style !== 'narrow' && style !== 'digital') style = 'short'
    let prevStyle: DurationFormatResolvedOptions['hours'] = style === 'digital' ? 'numeric' : style
    const hours = options.hours || prevStyle
    prevStyle = hours === '2-digit' ? 'numeric' : hours
    const minutes = options.minutes || prevStyle
    prevStyle = minutes === '2-digit' ? 'numeric' : minutes
    const seconds = options.seconds || prevStyle
    prevStyle = seconds === '2-digit' ? 'numeric' : seconds
    const milliseconds = options.milliseconds || prevStyle
    this.#options = {
      locale,
      style,
      years: options.years || style === 'digital' ? 'short' : style,
      yearsDisplay: options.yearsDisplay === 'always' ? 'always' : 'auto',
      months: options.months || style === 'digital' ? 'short' : style,
      monthsDisplay: options.monthsDisplay === 'always' ? 'always' : 'auto',
      weeks: options.weeks || style === 'digital' ? 'short' : style,
      weeksDisplay: options.weeksDisplay === 'always' ? 'always' : 'auto',
      days: options.days || style === 'digital' ? 'short' : style,
      daysDisplay: options.daysDisplay === 'always' ? 'always' : 'auto',
      hours,
      hoursDisplay: options.hoursDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
      minutes,
      minutesDisplay: options.minutesDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
      seconds,
      secondsDisplay: options.secondsDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
      milliseconds,
      millisecondsDisplay: options.millisecondsDisplay === 'always' ? 'always' : 'auto',
    }
  }

  resolvedOptions() {
    return this.#options
  }

  formatToParts(duration: Duration): DurationPart[] {
    const list: string[] = []
    const options = this.#options
    const style = options.style
    const locale = options.locale
    for (const [unit, nfUnit] of partsTable) {
      const value = duration[unit]
      if (options[`${unit}Display`] === 'auto' && !value) continue
      const unitStyle = options[unit]
      const nfOpts =
        unitStyle === '2-digit'
          ? twoDigitFormatOptions
          : unitStyle === 'numeric'
          ? {}
          : {style: 'unit', unit: nfUnit, unitDisplay: unitStyle}
      list.push(new Intl.NumberFormat(locale, nfOpts).format(value))
    }
    return new ListFormat(locale, {
      type: 'unit',
      style: style === 'digital' ? 'short' : style,
    }).formatToParts(list)
  }

  format(duration: Duration) {
    return this.formatToParts(duration)
      .map(p => p.value)
      .join('')
  }
}
