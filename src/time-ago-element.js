/* @flow strict */

import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'

export default class TimeAgoElement extends RelativeTimeElement {
  getFormattedDate(): ?string {
    const format = this.getAttribute('format')
    if (!this.date) return
    if (format === 'micro') {
      return new RelativeTime(this.date).microTimeAgo()
    } else {
      return new RelativeTime(this.date).timeAgo()
    }
  }
}

if (!window.customElements.get('time-ago')) {
  window.TimeAgoElement = TimeAgoElement
  window.customElements.define('time-ago', TimeAgoElement)
}
