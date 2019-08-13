/* @flow strict */

import RelativeTime from './relative-time'
import ExtendedTimeElement from './extended-time-element'
import {localeFromElement} from './utils'

export default class RelativeTimeElement extends ExtendedTimeElement {
  getFormattedDate(): ?string {
    const date = this.date
    if (date) {
      return new RelativeTime(date, localeFromElement(this)).toString()
    }
  }

  connectedCallback() {
    nowElements.push(this)

    clearTimeout(updateNowElementsId)
    updateNowElements()
    super.connectedCallback()
  }

  disconnectedCallback() {
    const ix = nowElements.indexOf(this)
    if (ix !== -1) {
      nowElements.splice(ix, 1)
    }

    if (!nowElements.length) {
      if (updateNowElementsId) {
        clearTimeout(updateNowElementsId)
        updateNowElementsId = null
      }
    }
  }
}

// Internal: Array tracking all elements attached to the document that need
// to be updated continuously.
const nowElements = []

// Internal: Timer ID for `updateNowElements` interval.
let updateNowElementsId

// Internal: Get the abs distance between now and a date
function getDistance(date) {
  if (date == null) {
    return 1000
  }
  return Math.abs(Date.now() - date.getTime())
}

// Internal: Depending on ms distance, decide when we need the next update
function getNextUpdate(ms) {
  if (ms <= 10 * 1000) {
    return 1000
  }
  if (ms <= 60 * 1000) {
    return 1000
  }
  if (ms <= 60 * 60 * 1000) {
    return 60 * 1000
  }
  return 10 * 60 * 1000
}

// Internal: Refresh all attached relative-time elements and set a new timeout
// for next run
function updateNowElements() {
  let nearestDistance
  for (let i = 0, len = nowElements.length; i < len; i++) {
    const timeEl = nowElements[i],
      timeDistance = getDistance(timeEl.date),
      oldValue = timeEl.textContent,
      newValue = timeEl.getFormattedDate() || ''

    if (oldValue !== newValue) {
      timeEl.textContent = newValue
      timeEl.dispatchEvent(
        new CustomEvent('relative-time-updated', {
          composed: true,
          detail: {
            oldValue,
            newValue
          }
        })
      )
    }
    if (nearestDistance == null || timeDistance < nearestDistance) {
      nearestDistance = timeDistance
    }
  }
  if (nearestDistance != null) {
    updateNowElementsId = setTimeout(updateNowElements, getNextUpdate(nearestDistance))
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
