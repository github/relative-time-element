/* @flow strict */

import {makeFormatter} from './utils'

export default class ExtendedTimeElement extends HTMLElement {
  static get observedAttributes() {
    return ['datetime', 'day', 'format', 'hour', 'minute', 'month', 'second', 'title', 'weekday', 'year']
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  // eslint-disable-next-line no-unused-vars
  attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
    const title = this.getFormattedTitle()
    if (title && !this.hasAttribute('title')) {
      this.setAttribute('title', title)
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }

  get date(): ?Date {
    const datetime = this.getAttribute('datetime')
    if (!datetime) return
    const millis = Date.parse(datetime)
    return isNaN(millis) ? null : new Date(millis)
  }

  // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.
  getFormattedTitle(): ?string {
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

  getFormattedDate(): ?string {}
}

const titleFormatter = makeFormatter({
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
})
