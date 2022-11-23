import type {Tense} from './relative-time-element.js'
import RelativeTimeElement from './relative-time-element.js'

export default class TimeAgoElement extends RelativeTimeElement {
  get tense(): Tense {
    return 'past'
  }
}
