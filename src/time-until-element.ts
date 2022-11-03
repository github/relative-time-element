import type {Tense} from './relative-time-element.js'
import RelativeTimeElement from './relative-time-element.js'

export default class TimeUntilElement extends RelativeTimeElement {
  get tense(): Tense {
    return 'future'
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
