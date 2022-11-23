import RelativeTimeElement from './relative-time-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('relative-time', RelativeTimeElement)
  root.RelativeTimeElement = RelativeTimeElement
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
    RelativeTimeElement: typeof RelativeTimeElement
  }
  interface HTMLElementTagNameMap {
    'relative-time': RelativeTimeElement
  }
}

export default RelativeTimeElement
export * from './relative-time-element.js'
