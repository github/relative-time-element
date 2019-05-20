/* @flow strict */

import RelativeTime from './relative-time'
import RelativeTimeElement from './relative-time-element'
import {localeFromElement} from './utils'

export default class TimeUntilElement extends RelativeTimeElement {
  getFormattedDate(): ?string {
    const format = this.getAttribute('format')
    if (!this._date) return
    if (format === 'micro') {
      return new RelativeTime(this._date, localeFromElement(this)).microTimeUntil()
    } else {
      return new RelativeTime(this._date, localeFromElement(this)).timeUntil()
    }
  }
}

if (!window.customElements.get('time-until')) {
  window.TimeUntilElement = TimeUntilElement
  window.customElements.define('time-until', TimeUntilElement)
}
