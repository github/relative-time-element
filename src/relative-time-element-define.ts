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

type JSXBaseElement = JSX.IntrinsicElements extends {span: unknown}
  ? JSX.IntrinsicElements['span']
  : Record<string, unknown>
declare global {
  interface Window {
    RelativeTimeElement: typeof RelativeTimeElement
  }
  interface HTMLElementTagNameMap {
    'relative-time': RelativeTimeElement
  }
  namespace JSX {
    interface IntrinsicElements {
      ['relative-time']: JSXBaseElement & Partial<Omit<RelativeTimeElement, keyof HTMLElement>>
    }
  }
}

export default RelativeTimeElement
export * from './relative-time-element.js'
