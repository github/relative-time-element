import RelativeTime from './relative-time.js'
import RelativeTimeElement from './relative-time-element.js'
import {localeFromElement} from './utils.js'

export default class TimeUntilElement extends RelativeTimeElement {
  getFormattedDate(): string | undefined {
    const format = this.getAttribute('format')
    const date = this.date
    if (!date) return
    if (format === 'micro') {
      return new RelativeTime(date, localeFromElement(this)).microTimeUntil()
    } else {
      return new RelativeTime(date, localeFromElement(this)).timeUntil()
    }
  }
}

if (!window.customElements.get('time-until')) {
  window.TimeUntilElement = TimeUntilElement
  window.customElements.define('time-until', TimeUntilElement)
}

declare global {
  interface Window {
    TimeUntilElement: typeof TimeUntilElement
  }
  interface HTMLElementTagNameMap {
    'time-until': TimeUntilElement
  }
}
