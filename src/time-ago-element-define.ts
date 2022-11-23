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

type JSXBaseElement = JSX.IntrinsicElements extends {span: unknown}
  ? JSX.IntrinsicElements['span']
  : Record<string, unknown>
declare global {
  interface Window {
    TimeAgoElement: typeof TimeAgoElement
  }
  interface HTMLElementTagNameMap {
    'time-ago': TimeAgoElement
  }
  namespace JSX {
    interface IntrinsicElements {
      ['time-ago']: JSXBaseElement & Partial<Omit<TimeAgoElement, keyof HTMLElement>>
    }
  }
}

export default TimeAgoElement
export * from './time-ago-element.js'
