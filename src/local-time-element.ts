import RelativeTimeElement from './relative-time-element.js'

export default class LocalTimeElement extends RelativeTimeElement {
  constructor() {
    super()
    // eslint-disable-next-line no-console
    console.warn('local-time element is deprecated and will be removed in v5.0.0')
  }

  get prefix() {
    return ''
  }

  get format() {
    if (super.format.includes('%')) return super.format
    if (!this.day && !this.month && !this.year && !this.timeZoneName && !this.hour && !this.minute) return ''
    return 'auto'
  }

  get day() {
    const day = this.getAttribute('day')
    if (day === 'numeric' || day === '2-digit') return day
  }

  get month() {
    const month = this.getAttribute('month')
    if (month === 'numeric' || month === '2-digit' || month === 'short' || month === 'long' || month === 'narrow') {
      return month
    }
  }

  get year() {
    const year = this.getAttribute('year')
    if (year === 'numeric' || year === '2-digit') return year
  }
}
