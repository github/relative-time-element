import RelativeTime from './relative-time'
import RelativeTimePrototype from './relative-time-element'

const TimeAgoPrototype = Object.create(RelativeTimePrototype)

TimeAgoPrototype.getFormattedDate = function() {
  if (this._date) {
    const format = this.getAttribute('format')
    if (format === 'micro') {
      return new RelativeTime(this._date).microTimeAgo()
    } else {
      return new RelativeTime(this._date).timeAgo()
    }
  }
}

window.TimeAgoElement = document.registerElement('time-ago', {
  prototype: TimeAgoPrototype
})
