import {strftime} from './strftime.js'
export class DateTimeFormat implements Intl.DateTimeFormat {
  #options: Intl.ResolvedDateTimeFormatOptions

  constructor(locale: string, options: Intl.DateTimeFormatOptions) {
    this.#options = {
      locale: 'en',
      calendar: 'gregory',
      numberingSystem: 'latn',
      weekday: options.weekday,
      minute: options.minute,
      hour: options.hour,
      day: options.day ?? '2-digit',
      month: options.month ?? '2-digit',
      year: options.year ?? 'numeric',
      timeZone: options.timeZone ?? ''
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
    if (month === 'numeric') str += ' %m'
    if (month === '2-digit') str += ' %m'
    if (month === 'long') str += ' %B'
    if (month === 'short') str += ' %b'
    if (month === 'narrow') str += ' %b'
    if (day === 'numeric') str += ' %e'
    if (day === '2-digit') str += ' %d'
    if (year === 'numeric') str += ', %Y'
    if (year === '2-digit') str += ', %y'
    if (hour === 'numeric') str += ' %H'
    if (hour === '2-digit') str += ' %H'
    if (minute === 'numeric') str += `${hour ? ':' : ''}%M`
    if (minute === '2-digit') str += `${hour ? ':' : ''}%M`
    if (second === 'numeric') str += `${hour ? ':' : ''}%S`
    if (second === '2-digit') str += `${hour || minute ? ':' : ''}%S`

    return strftime(new Date(value), str.trim())
  }
}
