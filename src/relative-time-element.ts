import {
  Duration,
  applyDuration,
  elapsedTime,
  getRelativeTimeUnit,
  getSingleUnit,
  isDuration,
  msUntilNextDay,
  roundToSingleUnit,
  RoundingOpts,
  Unit,
  unitNames,
} from './duration.js'
import {dateTimeFormat, relativeTimeFormat, getLocale as intlLocale} from './intl-cache.js'
const HTMLElement = globalThis.HTMLElement || (null as unknown as typeof window['HTMLElement'])

export type DeprecatedFormat = 'auto' | 'micro' | 'elapsed'
export type ResolvedFormat = 'duration' | 'relative' | 'datetime'
export type Format = DeprecatedFormat | ResolvedFormat
export type FormatStyle = 'long' | 'short' | 'narrow'
export type AbsoluteFormat = 'compact'
export type Tense = 'auto' | 'past' | 'future'

const emptyDuration = new Duration()
const microEmptyDuration = new Duration(0, 0, 0, 0, 0, 1)
const dateTimeFormatPattern =
  /^(?:\d{4}|(?!-000000)[+-]\d{6})(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01])(?:T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{3})?)?|24:00(?::00(?:\.000)?)?)(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?)?)?$/

function isValidDateTimeFormat(value: string): boolean {
  return dateTimeFormatPattern.test(value) && !Number.isNaN(Date.parse(value))
}

export class RelativeTimeUpdatedEvent extends Event {
  constructor(public oldText: string, public newText: string, public oldTitle: string, public newTitle: string) {
    super('relative-time-updated', {bubbles: true, composed: true})
  }
}

// Compact text changes at the day boundary. Text from a threshold can also turn relative.
type CompactAbsolute = false | 'day' | 'threshold'

function getUnitFactor(el: RelativeTimeElement, compactAbsolute: CompactAbsolute): number {
  const date = el.date
  if (!date) return Infinity
  const now = Date.now()
  if (el.format === 'duration' || el.format === 'elapsed') {
    const precision = el.precision
    if (precision === 'second') {
      return 1000
    } else if (precision === 'minute') {
      return 60 * 1000
    }
  }
  const ms = Math.abs(now - date.getTime())
  let factor = 60 * 60 * 1000
  if (ms < 60 * 1000) {
    factor = 1000
  } else if (ms < 60 * 60 * 1000) {
    factor = 60 * 1000
  }
  if (compactAbsolute === 'day' || (compactAbsolute && date.getTime() <= now)) {
    factor = msUntilNextDay(now, el.timeZone)
  } else if (compactAbsolute || ms >= 60 * 60 * 1000) {
    // Calendar labels change at the day boundary, even for recent compact timestamps.
    factor = Math.min(factor, msUntilNextDay(now, el.timeZone))
  }
  const threshold = getExplicitThreshold(el)
  if (el.format === 'micro' && threshold) {
    const thresholdDuration = Duration.from(threshold)
    const signedThresholdDuration = date.getTime() > now ? negateDuration(thresholdDuration) : thresholdDuration
    const thresholdTime = applyDuration(date, signedThresholdDuration).getTime()
    const msUntilThreshold = thresholdTime - now
    if (msUntilThreshold > 0) factor = Math.min(factor, msUntilThreshold)
  }
  return factor
}

function negateDuration(duration: Duration): Duration {
  return new Duration(
    -duration.years,
    -duration.months,
    -duration.weeks,
    -duration.days,
    -duration.hours,
    -duration.minutes,
    -duration.seconds,
    -duration.milliseconds,
  )
}

function getExplicitThreshold(el: RelativeTimeElement): string | null {
  const threshold = el.getAttribute('threshold')
  return threshold && isDuration(threshold) ? threshold : null
}

function getAffixes(formatter: Intl.DateTimeFormat, date: Date): readonly [string, string] {
  const parts = formatter.formatToParts(date)
  const first = parts[0]
  const last = parts[parts.length - 1]
  return [first?.type === 'literal' ? first.value : '', last?.type === 'literal' ? last.value : '']
}

function stripAffixes(text: string, start: string, end: string): string | undefined {
  if (text.startsWith(start) && text.endsWith(end) && start.length + end.length <= text.length) {
    return text.slice(start.length, text.length - end.length)
  }
}

function formatCompactToday(date: Date, locale: string, timeZone: string | undefined): string {
  const options = {timeZone, hourCycle: 'h12'} as const
  const today = relativeTimeFormat(locale, {numeric: 'auto'}).format(0, 'day')
  const time = dateTimeFormat(locale, {...options, hour: 'numeric', minute: '2-digit'}).format(date)
  const fallback = `${today} ${time}`
  const pattern = dateTimeFormat(locale, {...options, dateStyle: 'long', timeStyle: 'short'})
  if (/^(ja|zh|yue)(-|$)/.test(pattern.resolvedOptions().locale)) return fallback

  const parts = pattern.formatToParts(date)
  if (parts.some(part => part.type === 'unknown')) return fallback
  const fields = parts.flatMap(({type}, index) =>
    type === 'literal' ? [] : [{index, isTime: type === 'hour' || type === 'minute' || type === 'dayPeriod'}],
  )
  if (!fields.length) return fallback

  // Find two contiguous groups of fields (date and time), in either order.
  const timeFirst = fields[0].isTime
  const boundary = fields.findIndex(field => field.isTime !== timeFirst)
  if (boundary < 1 || fields.slice(boundary).some(field => field.isTime === timeFirst)) return fallback

  // Standalone fields can have their own affixes, e.g. the Korean day suffix "일".
  // Remove only matching affixes, leaving the combined pattern's connector literals intact.
  const dateAffixes = getAffixes(dateTimeFormat(locale, {...options, dateStyle: 'long'}), date)
  const timeAffixes = getAffixes(dateTimeFormat(locale, {...options, timeStyle: 'short'}), date)
  const [first, second] = timeFirst ? [timeAffixes, dateAffixes] : [dateAffixes, timeAffixes]
  const literals = (start: number, end?: number) =>
    parts
      .slice(start, end)
      .map(part => part.value)
      .join('')
  const prefix = stripAffixes(literals(0, fields[0].index), '', first[0])
  const separator = stripAffixes(literals(fields[boundary - 1].index + 1, fields[boundary].index), first[1], second[0])
  const suffix = stripAffixes(literals(fields[fields.length - 1].index + 1), second[1], '')
  // An unmatched letter or number attached to a field may be part of that field, not a connector.
  if (
    prefix === undefined ||
    !separator ||
    suffix === undefined ||
    /^[\p{L}\p{M}\p{N}]|[\p{L}\p{M}\p{N}]$/u.test(separator)
  ) {
    return fallback
  }

  return timeFirst ? `${prefix}${time}${separator}${today}${suffix}` : `${prefix}${today}${separator}${time}${suffix}`
}

// Determine whether the user has a 12 (vs. 24) hour cycle preference via the
// browser's resolved DateTimeFormat options. The result is environment-constant,
// so it is computed once and memoized.
let browser12hCycle: boolean | undefined
function isBrowser12hCycle(): boolean {
  if (browser12hCycle === undefined) {
    try {
      browser12hCycle = new Intl.DateTimeFormat([], {hour: 'numeric'}).resolvedOptions().hour12 === true
    } catch {
      browser12hCycle = false
    }
  }
  return browser12hCycle
}

// The resolved hour-cycle preference can change when the host locale changes, so
// drop the memoized value on `languagechange` (cached `Intl` formatters are
// invalidated separately in intl-cache).
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('languagechange', () => {
    browser12hCycle = undefined
  })
}

const dateObserver = new (class {
  elements = new Map<RelativeTimeElement, CompactAbsolute>()
  time = Infinity
  updating = false

  observe(element: RelativeTimeElement, compactAbsolute: CompactAbsolute) {
    this.elements.set(element, compactAbsolute)
    if (this.updating) return
    const date = element.date
    if (date) {
      const ms = getUnitFactor(element, compactAbsolute)
      const delay = compactAbsolute ? Math.min(60 * 60 * 1000, ms) : ms
      const time = Date.now() + delay
      if (time < this.time || this.time <= Date.now()) {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.update(), delay)
        this.time = time
      }
    }
  }

  unobserve(element: RelativeTimeElement) {
    if (!this.elements.has(element)) return
    this.elements.delete(element)
  }

  timer: ReturnType<typeof setTimeout> = -1 as unknown as ReturnType<typeof setTimeout>
  update() {
    clearTimeout(this.timer)
    this.time = Infinity
    if (!this.elements.size) return

    let nearestDistance = Infinity
    this.updating = true
    try {
      // An element that fails is not visited again this tick, even if it rejoined the observer by moving
      // itself, so it can't keep the tick from finishing
      let failed: Set<RelativeTimeElement> | undefined
      for (const timeEl of this.elements.keys()) {
        if (failed?.has(timeEl)) continue
        // One element failing must not stop the others updating or the timer rescheduling. The error
        // is rethrown from a task of its own so it is still reported, uncaught, exactly once.
        // (`setTimeout` rather than `reportError`, which older browsers and non-browser hosts lack.)
        try {
          if (!timeEl.isConnected) {
            this.elements.delete(timeEl)
            continue
          }
          const previousCompactAbsolute = this.elements.get(timeEl)
          const previousFactor =
            previousCompactAbsolute === undefined ? undefined : getUnitFactor(timeEl, previousCompactAbsolute)
          try {
            timeEl.update()
          } catch (error) {
            ;(failed ??= new Set()).add(timeEl)
            setTimeout(() => {
              throw error
            })
          }
          const compactAbsolute = this.elements.get(timeEl)
          if (compactAbsolute !== undefined) {
            const factor =
              compactAbsolute === previousCompactAbsolute ? previousFactor : getUnitFactor(timeEl, compactAbsolute)
            if (factor !== undefined) nearestDistance = Math.min(nearestDistance, factor)
          }
        } catch (error) {
          ;(failed ??= new Set()).add(timeEl)
          setTimeout(() => {
            throw error
          })
        }
      }
    } finally {
      this.updating = false
    }
    if (!this.elements.size) return
    const ms = Math.min(60 * 60 * 1000, nearestDistance)
    this.timer = setTimeout(() => this.update(), ms)
    this.time = Date.now() + ms
  }
})()

/**
 * @attr {'compact'} absolute-format
 */
export class RelativeTimeElement extends HTMLElement implements Intl.DateTimeFormatOptions {
  static define(tag = 'relative-time', registry = customElements) {
    registry.define(tag, this)
    return this
  }

  #customTitle = false
  #updating: false | Promise<void> = false

  get #lang() {
    const lang = this.closest('[lang]')?.getAttribute('lang') || this.ownerDocument.documentElement.getAttribute('lang')
    if (!lang) return 'default'
    try {
      return intlLocale(lang).toString()
    } catch {
      return 'default'
    }
  }

  get timeZone() {
    // Prefer attribute, then closest, then document
    const tz =
      this.closest('[time-zone]')?.getAttribute('time-zone') ||
      this.ownerDocument.documentElement.getAttribute('time-zone')
    return tz || undefined
  }

  get hourCycle() {
    // Prefer attribute, then closest, then document
    const hc =
      this.closest('[hour-cycle]')?.getAttribute('hour-cycle') ||
      this.ownerDocument.documentElement.getAttribute('hour-cycle')
    if (hc === 'h11' || hc === 'h12' || hc === 'h23' || hc === 'h24') return hc
    return isBrowser12hCycle() ? 'h12' : 'h23'
  }

  #renderRoot: Node & ParentNode = this.shadowRoot
    ? this.shadowRoot
    : this.attachShadow
    ? this.attachShadow({mode: 'open'})
    : this

  static get observedAttributes() {
    return [
      'second',
      'minute',
      'hour',
      'weekday',
      'day',
      'month',
      'year',
      'time-zone-name',
      'prefix',
      'threshold',
      'tense',
      'precision',
      'format',
      'format-style',
      'absolute-format',
      'no-title',
      'datetime',
      'lang',
      'title',
      'aria-hidden',
      'time-zone',
      'hour-cycle',
    ]
  }

  // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.
  #getFormattedTitle(
    date: Date,
    locale: string,
    timeZone: string | undefined,
    hourCycle: Intl.DateTimeFormatOptions['hourCycle'],
  ): string | undefined {
    return dateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone,
      hourCycle,
    }).format(date)
  }

  #getExplicitThreshold(): string | null {
    return getExplicitThreshold(this)
  }

  #resolveFormat(duration: Duration, thresholdDuration = duration): ResolvedFormat {
    const format: string = this.format
    if (format === 'datetime') return 'datetime'
    if (format === 'duration') return 'duration'

    // elapsed is an alias for 'duration'
    if (format === 'elapsed') return 'duration'
    if (format === 'micro') {
      const threshold = this.#getExplicitThreshold()
      if (threshold && Duration.compare(thresholdDuration, threshold) === -1) return 'datetime'
      return 'duration'
    }

    // 'auto' is an alias for 'relative'
    if ((format === 'auto' || format === 'relative') && typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const tense = this.tense
      if (tense === 'past' || tense === 'future') return 'relative'
      if (Duration.compare(duration, this.threshold) === 1) return 'relative'
    }
    return 'datetime'
  }

  #getMicroDuration(duration: Duration, rounding: RoundingOpts): Duration {
    duration = roundToSingleUnit(duration, rounding)
    // Allow month-level durations to pass through even with mismatched tense
    if (
      duration.months === 0 &&
      ((this.tense === 'past' && duration.sign !== -1) || (this.tense === 'future' && duration.sign !== 1))
    ) {
      return microEmptyDuration
    }
    return duration
  }

  #getMicroRelativeFormat(duration: Duration, locale: string, rounding: RoundingOpts): string {
    const relativeFormat = relativeTimeFormat(locale, {
      numeric: 'always',
      style: 'narrow',
    })
    duration = this.#getMicroDuration(duration, rounding)
    const [int, unit] = getSingleUnit(duration.blank ? microEmptyDuration : duration)
    return relativeFormat.format(Math.abs(int) * (this.tense === 'past' ? -1 : 1), unit)
  }

  #getDurationFormat(duration: Duration, locale: string, rounding: RoundingOpts): string {
    const format = this.format
    const style = this.formatStyle
    const tense = this.tense
    let empty = emptyDuration
    if (format === 'micro') {
      duration = this.#getMicroDuration(duration, rounding)
      empty = microEmptyDuration
    } else if ((tense === 'past' && duration.sign !== -1) || (tense === 'future' && duration.sign !== 1)) {
      duration = empty
    }
    const display = `${this.precision}sDisplay`
    if (duration.blank) {
      return empty.toLocaleString(locale, {style, [display]: 'always'})
    }
    return duration.abs().toLocaleString(locale, {style})
  }

  #getRelativeFormat(duration: Duration, locale: string, rounding: RoundingOpts): string {
    const relativeFormat = relativeTimeFormat(locale, {
      numeric: 'auto',
      style: this.formatStyle,
    })
    const tense = this.tense
    if (tense === 'future' && duration.sign !== 1) duration = emptyDuration
    if (tense === 'past' && duration.sign !== -1) duration = emptyDuration
    const [int, unit] = getRelativeTimeUnit(duration, rounding)
    if (unit === 'second' && Math.abs(int) < 10) {
      return relativeFormat.format(0, this.precision === 'millisecond' ? 'second' : this.precision)
    }
    return relativeFormat.format(int, unit)
  }

  #getDateTimeFormat(
    date: Date,
    locale: string,
    timeZone: string | undefined,
    hourCycle: Intl.DateTimeFormatOptions['hourCycle'],
  ): string {
    const formatter = dateTimeFormat(locale, {
      second: this.second,
      minute: this.minute,
      hour: this.hour,
      weekday: this.weekday,
      day: this.day,
      month: this.month,
      year: this.year,
      timeZoneName: this.timeZoneName,
      timeZone,
      hourCycle,
    })
    return `${this.prefix} ${formatter.format(date)}`.trim()
  }

  #getCompactAbsoluteTimeFormat(date: Date, locale: string, timeZone: string | undefined, isToday: boolean): string {
    if (isToday) return formatCompactToday(date, locale, timeZone)
    return dateTimeFormat(locale, {timeZone, month: 'short', day: 'numeric', year: 'numeric'}).format(date)
  }

  #isToday(date: Date, locale: string, timeZone: string | undefined, now = Date.now()): boolean {
    const formatter = dateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(now) === formatter.format(date)
  }

  #isCurrentYear(date: Date, locale: string, timeZone: string | undefined): boolean {
    const now = new Date()
    const formatter = dateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
    })
    return formatter.format(now) === formatter.format(date)
  }

  // If current day, shows "Today" + time.
  // If current year, shows date without year.
  // In all other scenarios, show full date.
  #getUserPreferredAbsoluteTimeFormat(
    date: Date,
    locale: string,
    timeZone: string | undefined,
    hourCycle: Intl.DateTimeFormatOptions['hourCycle'],
  ): string {
    const timeOnlyOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone,
      hourCycle,
    }

    if (this.#isToday(date, locale, timeZone)) {
      const relativeFormatter = relativeTimeFormat(locale, {numeric: 'auto'})
      let todayText = relativeFormatter.format(0, 'day')
      todayText = todayText.charAt(0).toLocaleUpperCase(locale) + todayText.slice(1)
      const timeOnly = dateTimeFormat(locale, timeOnlyOptions).format(date)

      return `${todayText} ${timeOnly}`
    }

    const timeAndDateOptions: Intl.DateTimeFormatOptions = {
      ...timeOnlyOptions,
      day: 'numeric',
      month: 'short',
    }
    if (this.#isCurrentYear(date, locale, timeZone)) {
      return dateTimeFormat(locale, timeAndDateOptions).format(date)
    }
    return dateTimeFormat(locale, {
      ...timeAndDateOptions,
      year: 'numeric',
    }).format(date)
  }

  #updateRenderRootContent(content: string | null): void {
    const root = this.#renderRoot
    const ariaHidden = this.hasAttribute('aria-hidden') && this.getAttribute('aria-hidden') === 'true'
    // Reuse the existing `part="root"` span across ticks and mutate it in place.
    // Reading the DOM tree/attributes below does not force style or layout recalc
    // (unlike geometry reads such as offsetWidth or innerText), so the only cost
    // that matters is the write — which we skip when nothing actually changed.
    // This is common on periodic ticks where the rendered text is identical to
    // the previous tick (e.g. an item that still reads "3mo").
    let span = root.firstElementChild
    if (!span || span.getAttribute('part') !== 'root' || root.childNodes.length !== 1) {
      span = document.createElement('span')
      span.setAttribute('part', 'root')
      root.replaceChildren(span)
    }
    if (ariaHidden) {
      if (span.getAttribute('aria-hidden') !== 'true') span.setAttribute('aria-hidden', 'true')
    } else if (span.hasAttribute('aria-hidden')) {
      span.removeAttribute('aria-hidden')
    }
    // Tabular numerals keep every digit the same width, so a ticking
    // duration/elapsed timer doesn't visibly jump around as it counts (#383).
    // Other formats get no inline style; `font-variant-numeric: normal !important`
    // on `::part(root)` still overrides this for opt-out.
    const tabular = this.format === 'duration' || this.format === 'elapsed'
    const fontVariantNumeric = tabular ? 'tabular-nums' : ''
    const spanStyle = (span as HTMLElement).style
    if (spanStyle.fontVariantNumeric !== fontVariantNumeric) {
      spanStyle.fontVariantNumeric = fontVariantNumeric
    }
    if (span.textContent !== content) {
      span.textContent = content
    }
  }

  #shouldDisplayUserPreferredAbsoluteTime(format: ResolvedFormat): boolean {
    // Never override duration or elapsed format with absolute format.
    if (format === 'duration' && this.format !== 'micro') return false

    return (
      this.ownerDocument.documentElement.getAttribute('data-prefers-absolute-time') === 'true' ||
      this.ownerDocument.body?.getAttribute('data-prefers-absolute-time') === 'true'
    )
  }

  #onRelativeTimeUpdated: ((event: RelativeTimeUpdatedEvent) => void) | null = null
  get onRelativeTimeUpdated() {
    return this.#onRelativeTimeUpdated
  }

  set onRelativeTimeUpdated(listener: ((event: RelativeTimeUpdatedEvent) => void) | null) {
    if (this.#onRelativeTimeUpdated) {
      this.removeEventListener(
        'relative-time-updated',
        this.#onRelativeTimeUpdated as unknown as EventListenerOrEventListenerObject,
      )
    }
    this.#onRelativeTimeUpdated = typeof listener === 'object' || typeof listener === 'function' ? listener : null
    if (typeof listener === 'function') {
      this.addEventListener('relative-time-updated', listener as unknown as EventListenerOrEventListenerObject)
    }
  }

  get second() {
    const second = this.getAttribute('second')
    if (second === 'numeric' || second === '2-digit') return second
  }

  set second(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('second', value || '')
  }

  get minute() {
    const minute = this.getAttribute('minute')
    if (minute === 'numeric' || minute === '2-digit') return minute
  }

  set minute(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('minute', value || '')
  }

  get hour() {
    const hour = this.getAttribute('hour')
    if (hour === 'numeric' || hour === '2-digit') return hour
  }

  set hour(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('hour', value || '')
  }

  get weekday() {
    const weekday = this.getAttribute('weekday')
    if (weekday === 'long' || weekday === 'short' || weekday === 'narrow') {
      return weekday
    }
    if (this.format === 'datetime' && weekday !== '') return this.formatStyle
  }

  set weekday(value: 'short' | 'long' | 'narrow' | undefined) {
    this.setAttribute('weekday', value || '')
  }

  get day() {
    const day = this.getAttribute('day') ?? 'numeric'
    if (day === 'numeric' || day === '2-digit') return day
  }

  set day(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('day', value || '')
  }

  get month() {
    const format = this.format
    let month = this.getAttribute('month')
    if (month === '') return
    month ??= format === 'datetime' ? this.formatStyle : 'short'
    if (month === 'numeric' || month === '2-digit' || month === 'short' || month === 'long' || month === 'narrow') {
      return month
    }
  }

  set month(value: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow' | undefined) {
    this.setAttribute('month', value || '')
  }

  get year() {
    const year = this.getAttribute('year')
    if (year === 'numeric' || year === '2-digit') return year

    const date = this.date
    if (!this.hasAttribute('year') && !(date && this.#isCurrentYear(date, this.#lang, this.timeZone))) {
      return 'numeric'
    }
  }

  set year(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('year', value || '')
  }

  get timeZoneName() {
    const name = this.getAttribute('time-zone-name')
    if (
      name === 'long' ||
      name === 'short' ||
      name === 'shortOffset' ||
      name === 'longOffset' ||
      name === 'shortGeneric' ||
      name === 'longGeneric'
    ) {
      return name
    }
  }

  set timeZoneName(
    value: 'long' | 'short' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric' | undefined,
  ) {
    this.setAttribute('time-zone-name', value || '')
  }

  /** @deprecated */
  get prefix(): string {
    return this.getAttribute('prefix') ?? (this.format === 'datetime' ? '' : 'on')
  }

  /** @deprecated */
  set prefix(value: string) {
    this.setAttribute('prefix', value)
  }

  get threshold(): string {
    const threshold = this.getAttribute('threshold')
    return threshold && isDuration(threshold) ? threshold : 'P30D'
  }

  set threshold(value: string) {
    this.setAttribute('threshold', value)
  }

  get tense(): Tense {
    const tense = this.getAttribute('tense')
    if (tense === 'past') return 'past'
    if (tense === 'future') return 'future'
    return 'auto'
  }

  set tense(value: Tense) {
    this.setAttribute('tense', value)
  }

  get precision(): Unit {
    const precision = this.getAttribute('precision') as unknown as Unit
    if (unitNames.includes(precision)) return precision
    if (this.format === 'micro') return 'minute'
    return 'second'
  }

  set precision(value: Unit) {
    this.setAttribute('precision', value)
  }

  get format(): Format {
    const format = this.getAttribute('format')
    if (format === 'datetime') return 'datetime'
    if (format === 'relative') return 'relative'
    if (format === 'duration') return 'duration'
    if (format === 'micro') return 'micro'
    if (format === 'elapsed') return 'elapsed'
    return 'auto'
  }

  set format(value: Format) {
    this.setAttribute('format', value)
  }

  /**
   * Optional preset for resolved absolute text. Overrides display fields and the hour cycle, not the title.
   * @attr absolute-format
   * @reflect
   */
  get absoluteFormat(): AbsoluteFormat | undefined {
    if (this.getAttribute('absolute-format') === 'compact') return 'compact'
  }

  set absoluteFormat(value: AbsoluteFormat | undefined) {
    if (value === undefined) {
      this.removeAttribute('absolute-format')
    } else {
      this.setAttribute('absolute-format', value)
    }
  }

  get formatStyle(): FormatStyle {
    const formatStyle = this.getAttribute('format-style')
    if (formatStyle === 'long') return 'long'
    if (formatStyle === 'short') return 'short'
    if (formatStyle === 'narrow') return 'narrow'
    const format = this.format
    if (format === 'elapsed' || format === 'micro') return 'narrow'
    if (format === 'datetime') return 'short'
    return 'long'
  }

  set formatStyle(value: FormatStyle) {
    this.setAttribute('format-style', value)
  }

  get noTitle(): boolean {
    return this.hasAttribute('no-title')
  }

  set noTitle(value: boolean | undefined) {
    this.toggleAttribute('no-title', value)
  }

  get datetime() {
    return this.getAttribute('datetime') || ''
  }

  set datetime(value: string) {
    this.setAttribute('datetime', value)
  }

  get date() {
    const parsed = Date.parse(this.datetime)
    return Number.isNaN(parsed) ? null : new Date(parsed)
  }

  set date(value: Date | null) {
    this.datetime = value?.toISOString() || ''
  }

  connectedCallback(): void {
    this.update()
  }

  disconnectedCallback(): void {
    dateObserver.unobserve(this)
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  attributeChangedCallback(attrName: string, oldValue: unknown, newValue: unknown): void {
    if (oldValue === newValue) return
    if (attrName === 'datetime' && typeof newValue === 'string' && newValue && !isValidDateTimeFormat(newValue)) {
      // eslint-disable-next-line i18n-text/no-en
      globalThis.console.warn(`The datetime attribute must use the ECMAScript date-time string format: ${newValue}`)
    }
    if (attrName === 'title') {
      this.#customTitle =
        newValue !== null &&
        (this.date && this.#getFormattedTitle(this.date, this.#lang, this.timeZone, this.hourCycle)) !== newValue
    }
    if (!this.#updating && !(attrName === 'title' && this.#customTitle)) {
      this.#updating = (async () => {
        await Promise.resolve()
        this.update()
        this.#updating = false
      })()
    }
  }

  update() {
    const oldText: string = this.#renderRoot.textContent || this.textContent || ''
    const oldTitle: string = this.getAttribute('title') || ''
    let newTitle: string = oldTitle
    const date = this.date
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat || !date) {
      this.#renderRoot.textContent = oldText
      return
    }
    const now = Date.now()
    // Resolve the locale/time-zone/hour-cycle once per update. Each getter walks
    // ancestors via `closest(...)`, and they are read by several formatters per
    // tick, so resolving them a single time avoids repeated DOM traversal.
    const locale = this.#lang
    const timeZone = this.timeZone
    const hourCycle = this.hourCycle
    if (!this.#customTitle) {
      newTitle = this.#getFormattedTitle(date, locale, timeZone, hourCycle) || ''
      if (newTitle && !this.noTitle && newTitle !== oldTitle) this.setAttribute('title', newTitle)
    }

    const duration = elapsedTime(date, this.precision, now)
    const rounding = {relativeTo: now, date, timeZone}
    const format = this.#resolveFormat(duration, elapsedTime(date, 'millisecond', now))
    let newText = oldText

    // Experimental: Enable absolute time if users prefers it, but never for `duration` format
    const displayUserPreferredAbsoluteTime = this.#shouldDisplayUserPreferredAbsoluteTime(format)
    const compactAbsolute =
      this.absoluteFormat === 'compact' && (displayUserPreferredAbsoluteTime || format === 'datetime')
    const compactToday = compactAbsolute && this.#isToday(date, locale, timeZone, now)
    if (compactAbsolute) {
      newText = this.#getCompactAbsoluteTimeFormat(date, locale, timeZone, compactToday)
    } else if (displayUserPreferredAbsoluteTime) {
      newText = this.#getUserPreferredAbsoluteTimeFormat(date, locale, timeZone, hourCycle)
    } else {
      if (format === 'duration') {
        if (this.format === 'micro' && this.tense !== 'auto' && Intl.RelativeTimeFormat) {
          newText = this.#getMicroRelativeFormat(duration, locale, rounding)
        } else {
          newText = this.#getDurationFormat(duration, locale, rounding)
        }
      } else if (format === 'relative') {
        newText = this.#getRelativeFormat(duration, locale, rounding)
      } else {
        newText = this.#getDateTimeFormat(date, locale, timeZone, hourCycle)
      }
    }

    if (newText) {
      this.#updateRenderRootContent(newText)
    } else if (this.shadowRoot === this.#renderRoot && this.textContent) {
      // Ensure invalid dates fall back to lightDOM text content
      this.#updateRenderRootContent(this.textContent)
    }

    if (newText !== oldText || newTitle !== oldTitle) {
      this.dispatchEvent(new RelativeTimeUpdatedEvent(oldText, newText, oldTitle, newTitle))
    }

    const isFuture = date.getTime() > now
    const compactBoundary =
      compactAbsolute &&
      !compactToday &&
      !isFuture &&
      this.#isToday(date, locale, timeZone, now + msUntilNextDay(now, timeZone))
    const shouldObserve = compactAbsolute
      ? compactToday || isFuture || compactBoundary
      : (!displayUserPreferredAbsoluteTime && (format === 'relative' || format === 'duration')) ||
        (this.format === 'micro' && Boolean(this.#getExplicitThreshold()) && isFuture) ||
        (displayUserPreferredAbsoluteTime &&
          (this.#isToday(date, locale, timeZone) || this.#isCurrentYear(date, locale, timeZone)))
    if (shouldObserve && this.isConnected) {
      dateObserver.observe(
        this,
        compactAbsolute && (displayUserPreferredAbsoluteTime || this.format === 'datetime' ? 'day' : 'threshold'),
      )
    } else {
      dateObserver.unobserve(this)
    }
  }
}

export default RelativeTimeElement
