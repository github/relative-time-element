import {unitNames, Unit, microTimeAgo, microTimeUntil, timeUntil, timeAgo, elapsedTime} from './duration-format.js'
import {isDuration, withinDuration} from './duration.js'
const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
const HTMLElement = root.HTMLElement || (null as unknown as typeof window['HTMLElement'])

export type Format = 'auto' | 'micro' | 'elapsed'
export type Tense = 'auto' | 'past' | 'future'

export class RelativeTimeUpdatedEvent extends Event {
  constructor(public oldText: string, public newText: string, public oldTitle: string, public newTitle: string) {
    super('relative-time-updated', {bubbles: true, composed: true})
  }
}

function getUnitFactor(el: RelativeTimeElement): number {
  if (!el.date) return Infinity
  if (el.format === 'elapsed') {
    const precision = el.precision
    if (precision === 'second') {
      return 1000
    } else if (precision === 'minute') {
      return 60 * 1000
    }
  }
  const ms = Math.abs(Date.now() - el.date.getTime())
  if (ms < 60 * 1000) return 1000
  if (ms < 60 * 60 * 1000) return 60 * 1000
  return 60 * 60 * 1000
}

const dateObserver = new (class {
  elements: Set<RelativeTimeElement> = new Set()
  time = Infinity

  observe(element: RelativeTimeElement) {
    if (this.elements.has(element)) return
    this.elements.add(element)
    const date = element.date
    if (date && date.getTime()) {
      const ms = getUnitFactor(element)
      const time = Date.now() + ms
      if (time < this.time) {
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
    for (const timeEl of this.elements) {
      nearestDistance = Math.min(nearestDistance, getUnitFactor(timeEl))
      timeEl.update()
    }
    this.time = Math.min(60 * 60 * 1000, nearestDistance)
    this.timer = setTimeout(() => this.update(), this.time)
    this.time += Date.now()
  }
})()

export default class RelativeTimeElement extends HTMLElement implements Intl.DateTimeFormatOptions {
  #customTitle = false
  #updating: false | Promise<void> = false

  get #lang() {
    return this.closest('[lang]')?.getAttribute('lang') ?? 'default'
  }

  #renderRoot: Node = this.shadowRoot ? this.shadowRoot : this.attachShadow ? this.attachShadow({mode: 'open'}) : this

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
      'datetime',
      'lang',
      'title'
    ]
  }

  // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.
  #getFormattedTitle(): string | undefined {
    const date = this.date
    if (!date) return
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return

    return new Intl.DateTimeFormat(this.#lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }

  #getFormattedDate(now = new Date()): string | undefined {
    const date = this.date
    if (!date) return
    const format = this.format
    if (format === 'elapsed') {
      const precisionIndex = unitNames.indexOf(this.precision) || 0
      const units = elapsedTime(date).filter(unit => unitNames.indexOf(unit[1]) >= precisionIndex)
      return units.map(([int, unit]) => `${int}${unit[0]}`).join(' ') || `0${this.precision[0]}`
    }
    const tense = this.tense
    const micro = format === 'micro'
    const inFuture = now.getTime() < date.getTime()
    const within = withinDuration(now, date, this.threshold)
    const locale = this.#lang
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const relativeFormat = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'})

      if (tense === 'past' || (tense === 'auto' && !inFuture && within)) {
        const [int, unit] = micro ? microTimeAgo(date) : timeAgo(date)
        if (micro) return `${int}${unit[0]}`
        return relativeFormat.format(int, unit)
      }
      if (tense === 'future' || (tense === 'auto' && inFuture && within)) {
        const [int, unit] = micro ? microTimeUntil(date) : timeUntil(date)
        if (micro) return `${int}${unit[0]}`
        return relativeFormat.format(int, unit)
      }
    }
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return
    const formatter = new Intl.DateTimeFormat(locale, {
      second: this.second,
      minute: this.minute,
      hour: this.hour,
      weekday: this.weekday,
      day: this.day,
      month: this.month,
      year: this.year,
      timeZoneName: this.timeZoneName
    })
    return `${this.prefix} ${formatter.format(date)}`.trim()
  }

  private getFormattedDate(now = new Date()): string | undefined {
    // eslint-disable-next-line no-console
    console.warn(`Calling getFormattedTitle is deprecated and will be removed in v4.0.0`)
    return this.#getFormattedDate(now)
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
    if (weekday === 'long' || weekday === 'short' || weekday === 'narrow') return weekday
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
    const month = this.getAttribute('month') ?? 'short'
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

    if (!this.hasAttribute('year') && new Date().getUTCFullYear() !== this.date?.getUTCFullYear()) {
      return 'numeric'
    }
  }

  set year(value: 'numeric' | '2-digit' | undefined) {
    this.setAttribute('day', value || '')
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
    value: 'long' | 'short' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric' | undefined
  ) {
    this.setAttribute('time-zone-name', value || '')
  }

  /** @deprecated */
  get prefix(): string {
    return this.getAttribute('prefix') ?? 'on'
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
    return 'second'
  }

  set precision(value: Unit) {
    this.setAttribute('precision', value)
  }

  get format(): Format {
    const format = this.getAttribute('format')
    if (format === 'micro') return 'micro'
    if (format === 'elapsed') return 'elapsed'
    return 'auto'
  }

  set format(value: Format) {
    this.setAttribute('format', value)
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
    if (attrName === 'title') {
      this.#customTitle = newValue !== null && this.#getFormattedTitle() !== newValue
    }
    if (!this.#updating && !(attrName === 'title' && this.#customTitle)) {
      this.#updating = (async () => {
        await Promise.resolve()
        this.update()
      })()
    }
  }

  update() {
    const oldText: string = this.#renderRoot.textContent || ''
    const oldTitle: string = this.getAttribute('title') || ''
    let newTitle: string = oldTitle
    let newText: string = oldText
    const now = new Date()
    if (!this.#customTitle) {
      newTitle = this.#getFormattedTitle() || ''
      if (newTitle) this.setAttribute('title', newTitle)
    }

    newText = this.#getFormattedDate(now) || ''
    if (newText) {
      this.#renderRoot.textContent = newText
    } else if (this.shadowRoot === this.#renderRoot && this.textContent) {
      // Ensure invalid dates fall back to lightDOM text content
      this.#renderRoot.textContent = this.textContent
    }

    if (newText !== oldText || newTitle !== oldTitle) {
      this.dispatchEvent(new RelativeTimeUpdatedEvent(oldText, newText, oldTitle, newTitle))
    }

    const date = this.date
    const format = this.format
    const isRelative = (format === 'auto' || format === 'micro') && date && withinDuration(now, date, this.threshold)
    if (format === 'elapsed' || isRelative) {
      dateObserver.observe(this)
    } else {
      dateObserver.unobserve(this)
    }
    this.#updating = false
  }
}
