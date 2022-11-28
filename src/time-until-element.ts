import type {Tense} from './relative-time-element.js'
import RelativeTimeElement from './relative-time-element.js'

export default class TimeUntilElement extends RelativeTimeElement {
  constructor() {
    super()
    // eslint-disable-next-line no-console
    console.warn('time-ago element is deprecated and will be removed in v5.0.0')
  }

  get tense(): Tense {
    return 'future'
  }
}
