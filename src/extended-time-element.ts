import {makeFormatter} from './utils'

const datetimes = new WeakMap()

export default class ExtendedTimeElement extends HTMLElement {
  static get observedAttributes(): string[] {
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
      'time-zone-name'
    ]
  }

  connectedCallback(): void {
    const title = this.getFormattedTitle()
    if (title && !this.hasAttribute('title')) {
      this.setAttribute('title', title)
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  attributeChangedCallback(attrName: string, oldValue: string, newValue: string): void {
    const oldTitle = this.getFormattedTitle()
    if (attrName === 'datetime') {
      const millis = Date.parse(newValue)
      if (isNaN(millis)) {
        datetimes.delete(this)
      } else {
        datetimes.set(this, new Date(millis))
      }
    }

    const title = this.getFormattedTitle()
    const currentTitle = this.getAttribute('title')
    if (attrName !== 'title' && title && (!currentTitle || currentTitle === oldTitle)) {
      this.setAttribute('title', title)
    }

    const text = this.getFormattedDate()
    if (text) {
      this.textContent = text
    }
  }

  get date(): Date | null {
    return datetimes.get(this)
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

  getFormattedDate(): string | undefined {
    return
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
