import {strftime, makeFormatter, isDayFirst} from './utils'
import ExtendedTimeElement from './extended-time-element'

const formatters = new WeakMap()

export default class LocalTimeElement extends ExtendedTimeElement {
  attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
    if (attrName === 'hour' || attrName === 'minute' || attrName === 'second' || attrName === 'time-zone-name') {
      formatters.delete(this)
    }
    super.attributeChangedCallback(attrName, oldValue, newValue)
  }

  // Formats the element's date, in the user's current locale, according to
  // the formatting attribute values. Values are not passed straight through to
  // an Intl.DateTimeFormat instance so that weekday and month names are always
  // displayed in English, for now.
  //
  // Supported attributes are:
  //
  //   weekday - "short", "long"
  //   year    - "numeric", "2-digit"
  //   month   - "short", "long"
  //   day     - "numeric", "2-digit"
  //   hour    - "numeric", "2-digit"
  //   minute  - "numeric", "2-digit"
  //   second  - "numeric", "2-digit"
  //
  // Returns a formatted time String.
  getFormattedDate(): string | undefined {
    const d = this.date
    if (!d) return

    const date = formatDate(this, d) || ''
    const time = formatTime(this, d) || ''
    return `${date} ${time}`.trim()
  }
}

// Private: Format a date according to the `weekday`, `day`, `month`,
// and `year` attribute values.
//
// This doesn't use Intl.DateTimeFormat to avoid creating text in the user's
// language when the majority of the surrounding text is in English. There's
// currently no way to separate the language from the format in Intl.
//
// el - The local-time element to format.
//
// Returns a date String or null if no date formats are provided.
function formatDate(el: Element, date: Date) {
  // map attribute values to strftime
  const props: {[key: string]: {[key: string]: string}} = {
    weekday: {
      short: '%a',
      long: '%A'
    },
    day: {
      numeric: '%e',
      '2-digit': '%d'
    },
    month: {
      short: '%b',
      long: '%B'
    },
    year: {
      numeric: '%Y',
      '2-digit': '%y'
    }
  }

  // build a strftime format string
  let format = isDayFirst() ? 'weekday day month year' : 'weekday month day, year'
  for (const prop in props) {
    const value = props[prop][el.getAttribute(prop) || '']
    format = format.replace(prop, value || '')
  }

  // clean up year separator comma
  format = format.replace(/(\s,)|(,\s$)/, '')

  // squeeze spaces from final string
  return strftime(date, format).replace(/\s+/, ' ').trim()
}

// Private: Format a time according to the `hour`, `minute`, and `second`
// attribute values.
//
// el - The local-time element to format.
//
// Returns a time String or null if no time formats are provided.
function formatTime(el: Element, date: Date) {
  const options: Intl.DateTimeFormatOptions = {}

  // retrieve format settings from attributes
  const hour = el.getAttribute('hour')
  if (hour === 'numeric' || hour === '2-digit') options.hour = hour
  const minute = el.getAttribute('minute')
  if (minute === 'numeric' || minute === '2-digit') options.minute = minute
  const second = el.getAttribute('second')
  if (second === 'numeric' || second === '2-digit') options.second = second
  const tz = el.getAttribute('time-zone-name')
  if (tz === 'short' || tz === 'long') options.timeZoneName = tz

  // No time format attributes provided.
  if (Object.keys(options).length === 0) {
    return
  }

  let factory = formatters.get(el)
  if (!factory) {
    factory = makeFormatter(options)
    formatters.set(el, factory)
  }

  const formatter = factory()
  if (formatter) {
    // locale-aware formatting of 24 or 12 hour times
    return formatter.format(date)
  } else {
    // fall back to strftime for non-Intl browsers
    const timef = options.second ? '%H:%M:%S' : '%H:%M'
    return strftime(date, timef)
  }
}

// Public: LocalTimeElement constructor.
//
//   var time = new LocalTimeElement()
//   # => <local-time></local-time>
//
if (!window.customElements.get('local-time')) {
  window.LocalTimeElement = LocalTimeElement
  window.customElements.define('local-time', LocalTimeElement)
}

declare global {
  interface Window {
    LocalTimeElement: typeof LocalTimeElement
  }
  interface HTMLElementTagNameMap {
    'local-time': LocalTimeElement
  }
}
