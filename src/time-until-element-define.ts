import TimeUntilElement from './time-until-element.js'

const root = (typeof globalThis !== 'undefined' ? globalThis : window) as typeof window
try {
  customElements.define('time-until', TimeUntilElement)
  root.TimeUntilElement = TimeUntilElement
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
    TimeUntilElement: typeof TimeUntilElement
  }
  interface HTMLElementTagNameMap {
    'time-until': TimeUntilElement
  }
  namespace JSX {
    interface IntrinsicElements {
      ['time-until']: JSXBaseElement & Partial<Omit<TimeUntilElement, keyof HTMLElement>>
    }
  }
}

export default TimeUntilElement
export * from './time-until-element.js'
