import { RelativeTimeElement } from './relative-time-element.js';
type JSXBase = JSX.IntrinsicElements extends {
    span: unknown;
} ? JSX.IntrinsicElements : Record<string, Record<string, unknown>>;
declare global {
    interface Window {
        RelativeTimeElement: typeof RelativeTimeElement;
    }
    interface HTMLElementTagNameMap {
        'relative-time': RelativeTimeElement;
    }
    namespace JSX {
        interface IntrinsicElements {
            ['relative-time']: JSXBase['span'] & Partial<Omit<RelativeTimeElement, keyof HTMLElement>>;
        }
    }
}
export default RelativeTimeElement;
export * from './relative-time-element.js';
