import TimeAgoElement from './time-ago-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('time-ago', TimeAgoElement)
  root.TimeAgoElement = TimeAgoElement
} catch (e: unknown) {
  if (
    !(root.DOMException && e instanceof DOMException && e.name === 'NotSupportedError') &&
    !(e instanceof ReferenceError)
  ) {
    throw e
  }
}

declare global {
  interface Window {
    TimeAgoElement: typeof TimeAgoElement
  }
  interface HTMLElementTagNameMap {
    'time-ago': TimeAgoElement
  }
}

export default TimeAgoElement
export * from './time-ago-element.js'
