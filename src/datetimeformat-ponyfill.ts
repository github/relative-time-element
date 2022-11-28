import {strftime} from './strftime.js'
export class DateTimeFormat implements Intl.DateTimeFormat {
  #options: Intl.ResolvedDateTimeFormatOptions

  constructor(locale: string, options: Intl.DateTimeFormatOptions) {
    // eslint-disable-next-line no-console
    console.warn(
      `time-elements v5.0.0 will no longer ship with DateTimeFormat ponyfill. It must be polyfilled for continued support in older browsers`
    )
    this.#options = {
      locale: 'en',
      calendar: 'gregory',
      numberingSystem: 'latn',
      weekday: options.weekday,
      minute: options.minute,
      hour: options.hour,
      day: options.day,
      month: options.month,
      year: options.year,
      timeZone: options.timeZone ?? ''
    }
    if (!Object.keys(options).length) {
      this.#options.day = '2-digit'
      this.#options.month = '2-digit'
      this.#options.year = 'numeric'
    }
  }

  formatToParts() {
    return []
  }

  resolvedOptions() {
    return this.#options
  }

  // Simplified "en" RelativeTimeFormat.format function
  //
  // Values should roughly match
  //   new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(value, unit)
  //
  format(value: number | Date): string {
    let str = ''
    const {weekday, month, day, year, hour, minute, second} = this.resolvedOptions()
    if (weekday === 'long') str += '%A'
    if (weekday === 'short') str += '%a'
    if (weekday === 'narrow') str += '%a'
    if ((month === 'numeric' || month === '2-digit') && day && year) {
      str += `${weekday ? ', ' : ''}%m/%d/%${year === '2-digit' ? 'y' : 'Y'}`
    } else {
      if (month === 'numeric') str += `${weekday ? ', ' : ''}%m`
      if (month === '2-digit') str += `${weekday ? ', ' : ''}%m`
      if (month === 'long') str += `${weekday ? ', ' : ''}%B`
      if (month === 'short') str += `${weekday ? ', ' : ''}%b`
      if (month === 'narrow') str += `${weekday ? ', ' : ''}%b`
      if (day === 'numeric') str += ' %e'
      if (day === '2-digit') str += ' %d'
      if (year === 'numeric') str += ', %Y'
      if (year === '2-digit') str += ', %y'
    }
    if (hour === 'numeric') str += `${str ? ',' : ''}%l`
    if (hour === '2-digit') str += `${str ? ', ' : ''}%H`
    if (minute === 'numeric') str += `${hour ? ':' : ''}%M`
    if (minute === '2-digit') str += `${hour ? ':' : ''}%M`
    if (second === 'numeric') str += `${hour ? ':' : ''}%S`
    if (second === '2-digit') str += `${hour || minute ? ':' : ''}%S`
    if (hour) str += ' %p'

    return strftime(new Date(value), str.trim())
  }
}
