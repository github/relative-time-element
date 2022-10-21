import {Tense} from './relative-time.js'
import RelativeTimeElement from './relative-time-element.js'

export default class TimeAgoElement extends RelativeTimeElement {
  get tense(): Tense {
    return 'past'
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
