import LocalTimeElement from './local-time-element.js'
import RelativeTimeElement from './relative-time-element.js'
import TimeAgoElement from './time-ago-element.js'
import TimeUntilElement from './time-until-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('relative-time', RelativeTimeElement)
  root.RelativeTimeElement = RelativeTimeElement
} catch (e: unknown) {
  if (!(e instanceof DOMException && e.name === 'NotSupportedError') && !(e instanceof ReferenceError)) throw e
}

try {
  customElements.define('local-time', LocalTimeElement)
  root.LocalTimeElement = LocalTimeElement
} catch (e: unknown) {
  if (!(e instanceof DOMException && e.name === 'NotSupportedError') && !(e instanceof ReferenceError)) throw e
}

try {
  customElements.define('time-ago', TimeAgoElement)
  root.TimeAgoElement = TimeAgoElement
} catch (e: unknown) {
  if (!(e instanceof DOMException && e.name === 'NotSupportedError') && !(e instanceof ReferenceError)) throw e
}

try {
  customElements.define('time-until', TimeUntilElement)
  root.TimeUntilElement = TimeUntilElement
} catch (e: unknown) {
  if (!(e instanceof DOMException && e.name === 'NotSupportedError') && !(e instanceof ReferenceError)) throw e
}

declare global {
  interface Window {
    RelativeTimeElement: typeof RelativeTimeElement
    LocalTimeElement: typeof LocalTimeElement
    TimeAgoElement: typeof TimeAgoElement
    TimeUntilElement: typeof TimeUntilElement
  }
  interface HTMLElementTagNameMap {
    'relative-time': RelativeTimeElement
    'local-time': LocalTimeElement
    'time-ago': TimeAgoElement
    'time-until': TimeUntilElement
  }
}

export {LocalTimeElement, RelativeTimeElement, TimeAgoElement, TimeUntilElement}
