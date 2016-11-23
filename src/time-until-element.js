import RelativeTime from './relative-time'
import RelativeTimePrototype from './relative-time-element'

const TimeUntilPrototype = Object.create(RelativeTimePrototype)

TimeUntilPrototype.getFormattedDate = function() {
  if (this._date) {
    const format = this.getAttribute('format')
    if (format === 'micro') {
      return new RelativeTime(this._date).microTimeUntil()
    } else {
      return new RelativeTime(this._date).timeUntil()
    }
  }
}

window.TimeUntilElement = document.registerElement('time-until', {
  prototype: TimeUntilPrototype
})
