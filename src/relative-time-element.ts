import type {Tense, Format} from './relative-time.js'
import RelativeTime from './relative-time.js'
import {makeFormatter, localeFromElement} from './utils.js'
import {isDuration, withinDuration} from './duration.js'
import {strftime} from './strftime.js'

export default class RelativeTimeElement extends HTMLElement implements Intl.DateTimeFormatOptions {
  #customTitle = false

  static get observedAttributes() {
    return [
      'datetime',
      'day',
      'format',
      'lang',
      'hour',
      'minute',
      'month',
      'second',
      'title',
      'weekday',
      'year',
      'tense',
      'time-zone-name',
      'prefix'
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

    const formatter = titleFormatter()
    if (formatter) {
      return formatter.format(date)
    } else {
      try {
        return date.toLocaleString()
      } catch (e) {
        if (e instanceof RangeError) {
          return date.toString()
        } else {
          throw e
        }
      }
    }
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
    const relativeTime = new RelativeTime(date, localeFromElement(this))
    if (tense === 'past' || (tense === 'auto' && !inFuture && within)) {
      return micro ? relativeTime.microTimeAgo() : relativeTime.timeAgo()
    }
    if (tense === 'future' || (tense === 'auto' && inFuture && within)) {
      return micro ? relativeTime.microTimeUntil() : relativeTime.timeUntil()
    }
    if ('Intl' in window && 'DateTimeFormat' in Intl) {
      const formatter = new Intl.DateTimeFormat(localeFromElement(this), {
        minute: this.minute,
        hour: this.hour,
        day: this.day,
        month: this.month,
        year: this.year
      })
      return `${this.prefix} ${formatter.format(date)}`.trim()
    }
    return `${this.prefix} ${strftime(date, `%b %e${this.year === 'numeric' ? ', %Y' : ''}`)}`.trim()
  }

  get minute() {
    const minute = this.getAttribute('minute')
    if (minute === 'numeric' || minute === '2-digit') return minute
  }
  get hour() {
    const hour = this.getAttribute('hour')
    if (hour === 'numeric' || hour === '2-digit') return hour
  }

  get day() {
    const day = this.getAttribute('day') ?? 'numeric'
    if (day === 'numeric' || day === '2-digit') return day
  }

  get month() {
    const month = this.getAttribute('month') ?? 'short'
    if (month === 'numeric' || month === '2-digit' || month === 'short' || month === 'long' || month === 'narrow')
      return month
  }

  get year() {
    const year = this.getAttribute('year')
    if (year === 'numeric' || year === '2-digit') return year

    if (new Date().getUTCFullYear() !== this.date?.getUTCFullYear()) {
      return 'numeric'
    }
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
    nowElements.push(this)

    if (!updateNowElementsId) {
      updateNowElements()
      updateNowElementsId = window.setInterval(updateNowElements, 60 * 1000)
    }

    const title = this.getFormattedTitle()
    if (title && !this.hasAttribute('title')) {
      this.setAttribute('title', title)
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }

  disconnectedCallback(): void {
    const ix = nowElements.indexOf(this)
    if (ix !== -1) {
      nowElements.splice(ix, 1)
    }

    if (!nowElements.length) {
      if (updateNowElementsId) {
        clearInterval(updateNowElementsId)
        updateNowElementsId = null
      }
    }
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  attributeChangedCallback(attrName: string): void {
    if (attrName === 'title') {
      this.#customTitle = true
    }
    if (!this.#customTitle) {
      const title = this.getFormattedTitle()
      if (title) {
        this.setAttribute('title', title)
        this.#customTitle = false
      }
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }
}

const titleFormatter = makeFormatter({
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
})

// Internal: Array tracking all elements attached to the document that need
// to be updated every minute.
const nowElements: RelativeTimeElement[] = []

// Internal: Timer ID for `updateNowElements` interval.
let updateNowElementsId: number | null

// Internal: Install a timer to refresh all attached relative-time elements every
// minute.
function updateNowElements() {
  let time
  let i
  let len

  for (i = 0, len = nowElements.length; i < len; i++) {
    time = nowElements[i]
    time.textContent = time.getFormattedDate() || ''
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
