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
import {
  Lookups,
  dateTimeFormat,
  relativeTimeFormat,
  getLocale as intlLocale,
  repeatLookups,
  startLookups,
  stopLookups,
} from './intl-cache.js'
const HTMLElement = globalThis.HTMLElement || (null as unknown as typeof window['HTMLElement'])

export type DeprecatedFormat = 'auto' | 'micro' | 'elapsed'
export type ResolvedFormat = 'duration' | 'relative' | 'datetime'
export type Format = DeprecatedFormat | ResolvedFormat
export type FormatStyle = 'long' | 'short' | 'narrow'
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

function getUnitFactor(el: RelativeTimeElement): number {
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
  } else {
    // Day rounding follows the calendar, so labels like "yesterday" change at midnight
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

// Incremented on `languagechange`, which can change formatting without any DOM change.
let environmentVersion = 0

// The resolved hour-cycle preference can change when the host locale changes, so
// drop the memoized value on `languagechange` (cached `Intl` formatters are
// invalidated separately in intl-cache).
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('languagechange', () => {
    browser12hCycle = undefined
    environmentVersion++
  })
}

const msPerSecond = 1000
const msPerMinute = 60 * msPerSecond
const msPerHour = 60 * msPerMinute
const msPerDay = 24 * msPerHour

// Host settings that change formatting without a `languagechange` event. The host reports
// changes between tasks, so they are read once per tick and once per microtask checkpoint.
// Null when they cannot be read, which never matches.
let hostSettingsRead = false
let hostSettings: string | null = null
function forgetHostSettings(): void {
  hostSettingsRead = false
}
function getHostSettings(): string | null {
  if (!hostSettingsRead) {
    try {
      queueMicrotask(forgetHostSettings)
      hostSettingsRead = true
    } catch {
      // Without a way to forget them, read them on every call
    }
    try {
      hostSettings = `${new Date().getTimezoneOffset()} ${new Intl.DateTimeFormat().resolvedOptions().timeZone}`
    } catch {
      hostSettings = null
    }
  }
  return hostSettings
}

// Names an instance could shadow to change what `update()` reads, such as `date` or `getAttribute`
let inheritedNames: Set<PropertyKey> | null = null
function shadowsInheritedMember(el: RelativeTimeElement): boolean {
  if (!inheritedNames) {
    inheritedNames = new Set()
    for (let proto = Object.getPrototypeOf(el); proto; proto = Object.getPrototypeOf(proto)) {
      for (const key of Reflect.ownKeys(proto)) inheritedNames.add(key)
    }
  }
  for (const key of Reflect.ownKeys(el)) {
    if (inheritedNames.has(key)) return true
  }
  return false
}

// Whether `el` is a plain `relative-time` that reads its inputs only through this class. Subclasses
// and overriding instances always render, so reading their inputs again is wasted and could run
// their code a different number of times. This is a function rather than a class member because
// tsc hoists private methods into the computed `[refresh]` key, which esbuild's bundle evaluates
// before the `RelativeTimeElement` binding exists.
function isPlainElement(el: RelativeTimeElement): boolean {
  return (
    Object.getPrototypeOf(el) === RelativeTimeElement.prototype && isClassUnchanged() && !shadowsInheritedMember(el)
  )
}

// Whether the prototype still has exactly the members it was defined with, each unchanged. A replaced
// member, such as the `date` getter or `update()`, or an added one, such as a `getAttribute` that
// shadows the built-in, can change what a render produces. Page code can change the prototype
// whenever it runs, so the answer is only reused until `pageCodeMayHaveRun()`: within a tick,
// between elements that neither render nor have overrides.
let pageCodeRuns = 0
let classCheckedAfter = -1
let classUnchanged = false
function pageCodeMayHaveRun(): void {
  pageCodeRuns++
}
function isClassUnchanged(): boolean {
  if (classCheckedAfter !== pageCodeRuns) {
    classCheckedAfter = pageCodeRuns
    classUnchanged = classMatchesDefinition()
  }
  return classUnchanged
}
function classMatchesDefinition(): boolean {
  const proto = RelativeTimeElement.prototype
  if (Object.getPrototypeOf(proto) !== definedMembers.parent) return false
  const keys = Reflect.ownKeys(proto)
  if (keys.length !== definedMembers.descriptors.size) return false
  for (const key of keys) {
    const defined = definedMembers.descriptors.get(key)
    const current = Object.getOwnPropertyDescriptor(proto, key)
    if (
      !defined ||
      !current ||
      defined.get !== current.get ||
      defined.set !== current.set ||
      defined.value !== current.value
    ) {
      return false
    }
  }
  return true
}

interface RenderInputs {
  attributeVersion: number
  environment: number
  lang: string | null
  rootAbsolute: string | null
  bodyAbsolute: string | null | undefined
}

interface DefinedMembers {
  parent: object | null
  descriptors: Map<PropertyKey, PropertyDescriptor>
}

// Re-renders an element unless its output is known to be unchanged. Module-private so the
// public `update()` keeps always re-rendering.
const refresh = Symbol('refresh')

const dateObserver = new (class {
  elements: Set<RelativeTimeElement> = new Set()
  time = Infinity
  updating = false

  observe(element: RelativeTimeElement) {
    this.elements.add(element)
    if (this.updating) return
    const date = element.date
    if (date) {
      const ms = getUnitFactor(element)
      const time = Date.now() + ms
      if (time < this.time || this.time <= Date.now()) {
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.update(), ms)
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
    if (!this.elements.size) return

    let nearestDistance = Infinity
    this.updating = true
    try {
      // Discard lookups left recording by a render that threw
      stopLookups()
      forgetHostSettings()
      pageCodeMayHaveRun()
      for (const timeEl of this.elements) {
        // Before anything reads the element, as an override can run page code or remove itself
        const plain = isPlainElement(timeEl)
        if (!timeEl.isConnected) {
          this.elements.delete(timeEl)
          if (!plain) pageCodeMayHaveRun()
          continue
        }
        nearestDistance = Math.min(nearestDistance, getUnitFactor(timeEl))
        if (!plain) pageCodeMayHaveRun()
        timeEl[refresh](plain)
        // An override can run page code after calling the inherited `update()`
        if (!plain) pageCodeMayHaveRun()
      }
    } finally {
      this.updating = false
    }
    this.time = Math.min(60 * 60 * 1000, nearestDistance)
    this.timer = setTimeout(() => this.update(), this.time)
    this.time += Date.now()
  }
})()

export class RelativeTimeElement extends HTMLElement implements Intl.DateTimeFormatOptions {
  static define(tag = 'relative-time', registry = customElements) {
    registry.define(tag, this)
    return this
  }

  #customTitle = false
  #updating: false | Promise<void> = false

  // Until `#stableUntil`, re-rendering produces the same output as long as every input recorded
  // here is unchanged. See `#isStable` and `#stableFor`.
  #attributeVersion = 0
  // Set while `update()` writes the title it computed, which is not a change to its inputs
  #settingTitle = false
  #stableUntil = -Infinity
  #renderedAt = 0
  #renderedAttributeVersion = -1
  #renderedEnvironment = 0
  #renderedHostSettings: string | null = null
  #renderedLookups: Lookups = []
  #renderedLang: string | null = null
  #renderedTimeZone: string | undefined
  #renderedHourCycle: Intl.DateTimeFormatOptions['hourCycle']
  #renderedRootAbsolute: string | null = null
  #renderedBodyAbsolute: string | null | undefined
  #renderedText: string | null = null
  #renderedAriaHidden: string | null = null
  #renderedFontVariantNumeric = ''

  get #rawLang() {
    return this.closest('[lang]')?.getAttribute('lang') || this.ownerDocument.documentElement.getAttribute('lang')
  }

  get #lang() {
    const lang = this.#rawLang
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

  #isToday(date: Date, locale: string, timeZone: string | undefined): boolean {
    const now = new Date()
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
    if (!this.#settingTitle) this.#attributeVersion++
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
        this[refresh]()
        this.#updating = false
      })()
    }
  }

  update() {
    pageCodeMayHaveRun()
    // Before reading any input, in case an override removes itself while being read, and before
    // writing to the DOM, which can run page code that changes an input
    const plainAtStart = isPlainElement(this)
    const inputs = plainAtStart ? this.#readInputs() : null
    const oldText: string = this.#renderRoot.textContent || this.textContent || ''
    const oldTitle: string = this.getAttribute('title') || ''
    let newTitle: string = oldTitle
    const date = this.date
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat || !date) {
      this.#stableUntil = -Infinity
      this.#renderRoot.textContent = oldText
      pageCodeMayHaveRun()
      return
    }
    startLookups()
    const now = Date.now()
    // Resolve the locale/time-zone/hour-cycle once per update. Each getter walks
    // ancestors via `closest(...)`, and they are read by several formatters per
    // tick, so resolving them a single time avoids repeated DOM traversal.
    const locale = this.#lang
    const timeZone = this.timeZone
    const hourCycle = this.hourCycle
    if (!this.#customTitle) {
      newTitle = this.#getFormattedTitle(date, locale, timeZone, hourCycle) || ''
      if (newTitle && !this.noTitle && newTitle !== oldTitle) {
        this.#settingTitle = true
        try {
          this.setAttribute('title', newTitle)
        } finally {
          this.#settingTitle = false
        }
      }
    }

    const duration = elapsedTime(date, this.precision, now)
    const rounding = {relativeTo: now, date, timeZone}
    const format = this.#resolveFormat(duration, elapsedTime(date, 'millisecond', now))
    let newText = oldText

    // Experimental: Enable absolute time if users prefers it, but never for `duration` format
    const displayUserPreferredAbsoluteTime = this.#shouldDisplayUserPreferredAbsoluteTime(format)
    if (displayUserPreferredAbsoluteTime) {
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

    // Record the inputs this render used before event listeners can change any of them
    const lookups = stopLookups()
    this.#recordRender(
      date,
      now,
      format,
      displayUserPreferredAbsoluteTime,
      timeZone,
      hourCycle,
      newTitle,
      lookups,
      inputs,
    )

    if (newText !== oldText || newTitle !== oldTitle) {
      this.dispatchEvent(new RelativeTimeUpdatedEvent(oldText, newText, oldTitle, newTitle))
      pageCodeMayHaveRun()
    }

    const shouldObserve =
      (!displayUserPreferredAbsoluteTime && (format === 'relative' || format === 'duration')) ||
      (this.format === 'micro' && Boolean(this.#getExplicitThreshold()) && date.getTime() > now) ||
      (displayUserPreferredAbsoluteTime &&
        (this.#isToday(date, locale, timeZone) || this.#isCurrentYear(date, locale, timeZone)))
    if (shouldObserve && this.isConnected) {
      dateObserver.observe(this)
    } else {
      dateObserver.unobserve(this)
    }
    // Writing to the DOM can run page code, such as a removed custom element's disconnectedCallback
    pageCodeMayHaveRun()
  }

  // Inputs that can change without a call into this element, read before a render uses them
  #readInputs(): RenderInputs {
    return {
      attributeVersion: this.#attributeVersion,
      environment: environmentVersion,
      lang: this.#rawLang,
      rootAbsolute: this.ownerDocument.documentElement.getAttribute('data-prefers-absolute-time'),
      bodyAbsolute: this.ownerDocument.body?.getAttribute('data-prefers-absolute-time'),
    }
  }

  #recordRender(
    date: Date,
    now: number,
    format: ResolvedFormat,
    displayUserPreferredAbsoluteTime: boolean,
    timeZone: string | undefined,
    hourCycle: Intl.DateTimeFormatOptions['hourCycle'],
    newTitle: string,
    lookups: Lookups | null,
    inputs: RenderInputs | null,
  ): void {
    this.#stableUntil = -Infinity
    if (!inputs || !isPlainElement(this)) return
    // A title that is computed but not written (`no-title`) fires an event on every render
    const titleSettled = newTitle === (this.getAttribute('title') || '')
    const stableFor =
      titleSettled && lookups ? this.#stableFor(date, now, format, displayUserPreferredAbsoluteTime, timeZone) : 0
    if (stableFor <= 0) return
    this.#stableUntil = now + stableFor
    this.#renderedLookups = lookups!
    this.#renderedAt = now
    this.#renderedAttributeVersion = inputs.attributeVersion
    this.#renderedEnvironment = inputs.environment
    this.#renderedHostSettings = getHostSettings()
    this.#renderedLang = inputs.lang
    this.#renderedTimeZone = timeZone
    this.#renderedHourCycle = hourCycle
    this.#renderedRootAbsolute = inputs.rootAbsolute
    this.#renderedBodyAbsolute = inputs.bodyAbsolute
    const span = this.#renderRoot.firstElementChild as HTMLElement | null
    this.#renderedText = span?.textContent ?? null
    this.#renderedAriaHidden = span?.getAttribute('aria-hidden') ?? null
    this.#renderedFontVariantNumeric = span?.style.fontVariantNumeric ?? ''
  }

  // `plain` is passed when the shared timer checked the element before reading it
  [refresh](plain?: boolean): void {
    if (!dateObserver.updating) pageCodeMayHaveRun()
    if (
      !(plain ?? isPlainElement(this)) ||
      typeof Intl === 'undefined' ||
      !Intl.DateTimeFormat ||
      !Intl.RelativeTimeFormat ||
      !this.#isStable(Date.now())
    ) {
      this.update()
    } else if (this.isConnected) {
      // A stable element renders relative text, which `update()` always observes
      dateObserver.observe(this)
    } else {
      dateObserver.unobserve(this)
    }
  }

  // Whether `update()` would render exactly what is already rendered and fire no event: before
  // `#stableUntil`, with no attribute, ancestor, locale, time zone or rendered DOM change since
  // the last render. The DOM checks match the ones `#updateRenderRootContent` uses to skip writes.
  #isStable(now: number): boolean {
    if (
      !(now < this.#stableUntil) ||
      now < this.#renderedAt ||
      this.#attributeVersion !== this.#renderedAttributeVersion ||
      environmentVersion !== this.#renderedEnvironment
    ) {
      return false
    }
    const root = this.#renderRoot
    const span = root.firstElementChild as HTMLElement | null
    return (
      span !== null &&
      root.childNodes.length === 1 &&
      span.getAttribute('part') === 'root' &&
      span.textContent === this.#renderedText &&
      span.getAttribute('aria-hidden') === this.#renderedAriaHidden &&
      span.style.fontVariantNumeric === this.#renderedFontVariantNumeric &&
      this.#rawLang === this.#renderedLang &&
      this.timeZone === this.#renderedTimeZone &&
      this.hourCycle === this.#renderedHourCycle &&
      this.ownerDocument.documentElement.getAttribute('data-prefers-absolute-time') === this.#renderedRootAbsolute &&
      this.ownerDocument.body?.getAttribute('data-prefers-absolute-time') === this.#renderedBodyAbsolute &&
      this.#renderedHostSettings !== null &&
      getHostSettings() === this.#renderedHostSettings &&
      // Last, as it updates the caches' least-recently-used order
      repeatLookups(this.#renderedLookups)
    )
  }

  // Milliseconds for which the rendered text cannot change, or 0 when unknown. Covers only
  // `relative` output with `second` precision between a minute and 28 days, where
  // `roundToSingleUnit` changes the text only when:
  // - under an hour, the elapsed seconds reach :55 (rounding up a minute) or :00
  // - from an hour, the elapsed time within the hour reaches 54:55 (rounding up an hour) or 00:00
  // - the calendar date changes locally or in UTC (used by `Duration.compare`)
  // - the elapsed time reaches `threshold`, switching to `datetime`
  // Elements with a `time-zone` are never covered: a fixed offset can be any number of minutes, and
  // historical offsets have seconds, so only an Intl lookup could place that zone's midnight. Clocks
  // before 1970 are not covered either, as `now % msPerDay` is negative for them.
  #stableFor(
    date: Date,
    now: number,
    format: ResolvedFormat,
    displayUserPreferredAbsoluteTime: boolean,
    timeZone: string | undefined,
  ): number {
    if (format !== 'relative' || displayUserPreferredAbsoluteTime || this.precision !== 'second') return 0
    if (timeZone || now < 0) return 0
    const delta = date.getTime() - now
    const elapsed = Math.abs(delta)
    if (elapsed < msPerMinute || elapsed >= 28 * msPerDay) return 0
    const step = elapsed < msPerHour ? msPerMinute : msPerHour
    const roundUp = elapsed < msPerHour ? 55 * msPerSecond : 54 * msPerMinute + 55 * msPerSecond
    const position = elapsed % step
    let stable: number
    if (delta < 0) {
      stable = position < roundUp ? roundUp - position : step - position
    } else {
      // Elapsed time shrinks toward a future date
      stable = position >= roundUp ? position - roundUp : position
    }
    stable = Math.min(stable, msUntilNextDay(now), msPerDay - (now % msPerDay))
    if (this.tense === 'auto' && delta < 0) {
      const threshold = Math.abs(applyDuration(now, Duration.from(this.threshold)).getTime() - now)
      stable = Math.min(stable, threshold - elapsed - msPerSecond)
    }
    return Math.max(0, stable)
  }
}

const definedMembers: DefinedMembers = {
  parent: Object.getPrototypeOf(RelativeTimeElement.prototype),
  descriptors: new Map(
    Reflect.ownKeys(RelativeTimeElement.prototype).map(key => [
      key,
      Object.getOwnPropertyDescriptor(RelativeTimeElement.prototype, key)!,
    ]),
  ),
}

export default RelativeTimeElement
