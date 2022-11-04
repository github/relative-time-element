import DurationFormat from './relative-time.js'
import {DateTimeFormat as DateTimeFormatPonyFill} from './datetimeformat-ponyfill.js'
import {RelativeTimeFormat as RelativeTimeFormatPonyfill} from './relative-time-ponyfill.js'
import {isDuration, withinDuration} from './duration.js'
import {strftime} from './strftime.js'

const supportsIntlDatetime = 'Intl' in window && 'DateTimeFormat'
const DateTimeFormat = supportsIntlDatetime ? Intl.DateTimeFormat : DateTimeFormatPonyFill

const supportsIntlRelativeTime = 'Intl' in window && 'RelativeTimeFormat'
const RelativeTimeFormat = supportsIntlRelativeTime ? Intl.RelativeTimeFormat : RelativeTimeFormatPonyfill

export type Format = 'auto' | 'micro' | string
export type Tense = 'auto' | 'past' | 'future'

export class RelativeTimeUpdatedEvent extends Event {
  constructor(public oldText: string, public newText: string, public oldTitle: string, public newTitle: string) {
    super('relative-time-updated', {bubbles: true, composed: true})
  }
}

function getUnitFactor(ms: number): number {
  ms = Math.abs(Date.now() - ms)
  if (ms < 60 * 1000) return 1000
  if (ms < 60 * 60 * 1000) return 60 * 1000
  return 60 * 60 * 1000
}

const dateObserver = new (class {
  elements: Set<RelativeTimeElement> = new Set()

  observe(element: RelativeTimeElement) {
    if (this.elements.has(element)) return
    this.elements.add(element)
    this.update()
  }

  unobserve(element: RelativeTimeElement) {
    if (!this.elements.has(element)) return
    this.elements.delete(element)
    this.update()
  }

  timer: ReturnType<typeof setTimeout> = -1 as unknown as ReturnType<typeof setTimeout>
  update() {
    clearTimeout(this.timer)
    if (!this.elements.size) return

    let nearestDistance = Infinity
    for (const timeEl of this.elements) {
      const distance = timeEl.date ? getUnitFactor(timeEl.date.getTime()) : Infinity
      nearestDistance = Math.min(nearestDistance, distance)
      timeEl.update()
    }
    const ms = Math.min(60 * 60 * 1000, nearestDistance)
    this.timer = setTimeout(() => this.update(), ms)
  }
})()

export default class RelativeTimeElement extends HTMLElement implements Intl.DateTimeFormatOptions {
  #customTitle = false

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
      'threhsold',
      'tense',
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
  getFormattedTitle(): string | undefined {
    const date = this.date
    if (!date) return

    return new DateTimeFormat(this.#lang, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }

  getFormattedDate(now = new Date()): string | undefined {
    const date = this.date
    if (!date) return
    const format = this.format
    if (format !== 'auto' && format !== 'micro') {
      return strftime(date, format)
    }
    const tense = this.tense
    const micro = format === 'micro'
    const inFuture = now.getTime() < date.getTime()
    const within = withinDuration(now, date, this.threshold)
    const locale = this.#lang
    const durationFormat = new DurationFormat(date)
    const relativeFormat = new RelativeTimeFormat(locale, {numeric: 'auto'})

    if (tense === 'past' || (tense === 'auto' && !inFuture && within)) {
      const [int, unit] = micro ? durationFormat.microTimeAgo() : durationFormat.timeAgo()
      if (micro) return `${int}${unit[0]}`
      return relativeFormat.format(int, unit)
    }
    if (tense === 'future' || (tense === 'auto' && inFuture && within)) {
      const [int, unit] = micro ? durationFormat.microTimeUntil() : durationFormat.timeUntil()
      if (micro) return `${int}${unit[0]}`
      return relativeFormat.format(int, unit)
    }
    const formatter = new DateTimeFormat(locale, {
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

  get format(): Format {
    const format = this.getAttribute('format')
    if (format === 'micro') return 'micro'
    if (format && format.includes('%')) return format
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
  attributeChangedCallback(attrName: string): void {
    if (attrName === 'title') {
      this.#customTitle = true
    }
    this.update()
  }

  update() {
    const oldText: string = this.#renderRoot.textContent || ''
    const oldTitle: string = this.getAttribute('title') || ''
    let newTitle: string = oldTitle
    let newText: string = oldText
    const now = new Date()
    if (!this.#customTitle) {
      newTitle = this.getFormattedTitle() || ''
      if (newTitle) {
        this.setAttribute('title', newTitle)
        this.#customTitle = false
      }
    }

    newText = this.getFormattedDate(now) || ''
    if (newText) {
      this.#renderRoot.textContent = newText
    }

    if (newText !== oldText || newTitle !== oldTitle) {
      this.dispatchEvent(new RelativeTimeUpdatedEvent(oldText, newText, oldTitle, newTitle))
    }

    const date = this.date
    const format = this.format
    const isRelative = (format === 'auto' || format === 'micro') && date && withinDuration(now, date, this.threshold)
    if (isRelative) {
      dateObserver.observe(this)
    } else {
      dateObserver.unobserve(this)
    }
  }
}

// Public: RelativeTimeElement constructor.
//
//   var time = new RelativeTimeElement()
//   # => <relative-time></relative-time>
//
if (!window.customElements.get('relative-time')) {
  window.RelativeTimeElement = RelativeTimeElement
  window.customElements.define('relative-time', RelativeTimeElement)
}

declare global {
  interface Window {
    RelativeTimeElement: typeof RelativeTimeElement
  }
  interface HTMLElementTagNameMap {
    'relative-time': RelativeTimeElement
  }
}
