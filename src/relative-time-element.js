/* @flow strict */

import RelativeTime from './relative-time'
import ExtendedTimeElement from './extended-time-element'
import {localeFromElement} from './utils'

// Internal: Array tracking all elements attached to the document that need
// to be updated every minute.
const nowElements = new Set()

// Internal: Timer ID for `updateNowElements` interval.
let updateNowElementsId

// Internal: Install a timer to refresh all attached relative-time elements every
// minute.
function updateNowElements() {
  clearTimeout(updateNowElementsId)
  for (const el of nowElements) el.textContent = el.getFormattedDate() || ''
  if (nowElements.size) updateNowElementsId = setTimeout(updateNowElements, 60 * 1000)
}

export default class RelativeTimeElement extends ExtendedTimeElement {
  getFormattedDate(): ?string {
    const date = this.date
    if (date) {
      return new RelativeTime(date, localeFromElement(this)).toString()
    }
  }

  connectedCallback() {
    nowElements.add(this)
    updateNowElements()
    super.connectedCallback()
  }

  disconnectedCallback() {
    nowElements.delete(this)
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
