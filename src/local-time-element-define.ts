import LocalTimeElement from './local-time-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('local-time', LocalTimeElement)
  root.LocalTimeElement = LocalTimeElement
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
    LocalTimeElement: typeof LocalTimeElement
  }
  interface HTMLElementTagNameMap {
    'local-time': LocalTimeElement
  }
}

export default LocalTimeElement
export * from './local-time-element.js'
