/* @flow strict */

import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'
import {localeFromElement} from './utils'

export default class TimeAgoElement extends RelativeTimeElement {
  getFormattedDate(): ?string {
    const format = this.getAttribute('format')
    if (!this._date) return
    if (format === 'micro') {
      return new RelativeTime(this._date, localeFromElement(this)).microTimeAgo()
    } else {
      return new RelativeTime(this._date, localeFromElement(this)).timeAgo()
    }
  }
}

if (!window.customElements.get('time-ago')) {
  window.TimeAgoElement = TimeAgoElement
  window.customElements.define('time-ago', TimeAgoElement)
}
