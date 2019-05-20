/* @flow strict */

import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'

export default class TimeUntilElement extends RelativeTimeElement {
  getFormattedDate(): ?string {
    const format = this.getAttribute('format')
    const date = this.date
    if (!date) return
    if (format === 'micro') {
      return new RelativeTime(date).microTimeUntil()
    } else {
      return new RelativeTime(date).timeUntil()
    }
  }
}

if (!window.customElements.get('time-until')) {
  window.TimeUntilElement = TimeUntilElement
  window.customElements.define('time-until', TimeUntilElement)
}
