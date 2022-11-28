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

type JSXBaseElement = JSX.IntrinsicElements extends {span: unknown}
  ? JSX.IntrinsicElements['span']
  : Record<string, unknown>
declare global {
  interface Window {
    LocalTimeElement: typeof LocalTimeElement
  }
  interface HTMLElementTagNameMap {
    'local-time': LocalTimeElement
  }
  namespace JSX {
    interface IntrinsicElements {
      ['local-time']: JSXBaseElement & Partial<Omit<LocalTimeElement, keyof HTMLElement>>
    }
  }
}

export default LocalTimeElement
export * from './local-time-element.js'
