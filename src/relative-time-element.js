import RelativeTime from './relative-time'
import ExtendedTimeElement from './extended-time-element'

export default class RelativeTimeElement extends ExtendedTimeElement {
  getFormattedDate() {
    if (this._date) {
      return new RelativeTime(this._date).toString()
    }
  }

  connectedCallback() {
    nowElements.push(this)

    if (!updateNowElementsId) {
      updateNowElements()
      updateNowElementsId = setInterval(updateNowElements, 60 * 1000)
    }
  }

  disconnectedCallback() {
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
if (!window.customElements.get('relative-time')) {
  window.RelativeTimeElement = RelativeTimeElement
  window.customElements.define('relative-time', RelativeTimeElement)
}
