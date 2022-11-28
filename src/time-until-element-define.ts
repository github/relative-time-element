import TimeUntilElement from './time-until-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('time-until', TimeUntilElement)
  root.TimeUntilElement = TimeUntilElement as unknown as never
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
    TimeUntilElement: never
  }
}

export default TimeUntilElement
export * from './time-until-element.js'
