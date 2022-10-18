import RelativeTime from './relative-time.js'
import RelativeTimeElement from './relative-time-element.js'
import {localeFromElement} from './utils.js'

export default class TimeAgoElement extends RelativeTimeElement {
  getFormattedDate(): string | undefined {
    const format = this.getAttribute('format')
    const date = this.date
    if (!date) return
    if (format === 'micro') {
      return new RelativeTime(date, localeFromElement(this)).microTimeAgo()
    } else {
      return new RelativeTime(date, localeFromElement(this)).timeAgo()
    }
  }
}

if (!window.customElements.get('time-ago')) {
  window.TimeAgoElement = TimeAgoElement
  window.customElements.define('time-ago', TimeAgoElement)
}

declare global {
  interface Window {
    TimeAgoElement: typeof TimeAgoElement
  }
  interface HTMLElementTagNameMap {
    'time-ago': TimeAgoElement
  }
}
