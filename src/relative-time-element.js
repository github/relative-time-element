import RelativeTime from './relative-time'
import ExtendedTimePrototype from './extended-time-element'

const RelativeTimePrototype = Object.create(ExtendedTimePrototype)

RelativeTimePrototype.createdCallback = function() {
  const value = this.getAttribute('datetime')
  if (value) {
    this.attributeChangedCallback('datetime', null, value)
  }
}

RelativeTimePrototype.getFormattedDate = function() {
  if (this._date) {
    return new RelativeTime(this._date).toString()
  }
}

RelativeTimePrototype.attachedCallback = function() {
  nowElements.push(this)

  if (!updateNowElementsId) {
    updateNowElements()
    updateNowElementsId = setInterval(updateNowElements, 60 * 1000)
  }
}

RelativeTimePrototype.detachedCallback = function() {
  const ix = nowElements.indexOf(this)
  if (ix !== -1) {
    nowElements.splice(ix, 1)
  }

  if (!nowElements.length) {
    if (updateNowElementsId) {
      clearInterval(updateNowElementsId)
      updateNowElementsId = null
    }
  }
}

// Internal: Array tracking all elements attached to the document that need
// to be updated every minute.
const nowElements = []

// Internal: Timer ID for `updateNowElements` interval.
let updateNowElementsId

// Internal: Install a timer to refresh all attached relative-time elements every
// minute.
function updateNowElements() {
  let time, i, len
  for (i = 0, len = nowElements.length; i < len; i++) {
    time = nowElements[i]
    time.textContent = time.getFormattedDate()
  }
}

// Public: RelativeTimeElement constructor.
//
//   var time = new RelativeTimeElement()
//   # => <relative-time></relative-time>
//
window.RelativeTimeElement = document.registerElement('relative-time', {
  prototype: RelativeTimePrototype
})

export default RelativeTimePrototype
