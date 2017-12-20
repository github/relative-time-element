import {makeFormatter} from './utils'

export default class ExtendedTimeElement extends HTMLElement {
  static get observedAttributes() {
    return ['datetime', 'day', 'format', 'hour', 'minute', 'month', 'second', 'title', 'weekday', 'year']
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  //
  // Returns nothing.
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'datetime') {
      const millis = Date.parse(newValue)
      this._date = isNaN(millis) ? null : new Date(millis)
    }

    const title = this.getFormattedTitle()
    if (title) {
      this.setAttribute('title', title)
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }

  // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.
  getFormattedTitle() {
    if (!this._date) {
      return
    }

    if (this.hasAttribute('title')) {
      return this.getAttribute('title')
    }

    const formatter = makeFormatter({
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    if (formatter) {
      return formatter.format(this._date)
    } else {
      try {
        return this._date.toLocaleString()
      } catch (e) {
        if (e instanceof RangeError) {
          return this._date.toString()
        } else {
          throw e
        }
      }
    }
  }
}
