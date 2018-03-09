import {strftime, makeFormatter, isDayFirst} from './utils'
import ExtendedTimeElement from './extended-time-element'

export default class LocalTimeElement extends ExtendedTimeElement {
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
  getFormattedDate() {
    if (!this._date) {
      return
    }

    const date = formatDate(this) || ''
    const time = formatTime(this) || ''
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
function formatDate(el) {
  // map attribute values to strftime
  const props = {
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
    const value = props[prop][el.getAttribute(prop)]
    format = format.replace(prop, value || '')
  }

  // clean up year separator comma
  format = format.replace(/(\s,)|(,\s$)/, '')

  // squeeze spaces from final string
  return strftime(el._date, format)
    .replace(/\s+/, ' ')
    .trim()
}

// Private: Format a time according to the `hour`, `minute`, and `second`
// attribute values.
//
// el - The local-time element to format.
//
// Returns a time String or null if no time formats are provided.
function formatTime(el) {
  // retrieve format settings from attributes
  const options = {
    hour: el.getAttribute('hour'),
    minute: el.getAttribute('minute'),
    second: el.getAttribute('second'),
    timeZoneName: el.getAttribute('time-zone-name')
  }

  // remove unset format attributes
  for (const opt in options) {
    if (!options[opt]) {
      delete options[opt]
    }
  }

  // no time format attributes provided
  if (Object.keys(options).length === 0) {
    return
  }

  const formatter = makeFormatter(options)
  if (formatter) {
    // locale-aware formatting of 24 or 12 hour times
    return formatter.format(el._date)
  } else {
    // fall back to strftime for non-Intl browsers
    const timef = options.second ? '%H:%M:%S' : '%H:%M'
    return strftime(el._date, timef)
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
