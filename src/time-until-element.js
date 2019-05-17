/* @flow strict */

import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'

export default class TimeUntilElement extends RelativeTimeElement {
  getFormattedDate(): ?string {
    const format = this.getAttribute('format')
    if (!this.date) return
    if (format === 'micro') {
      return new RelativeTime(this.date).microTimeUntil()
    } else {
      return new RelativeTime(this.date).timeUntil()
    }
  }
}

if (!window.customElements.get('time-until')) {
  window.TimeUntilElement = TimeUntilElement
  window.customElements.define('time-until', TimeUntilElement)
}
