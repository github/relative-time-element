import {RelativeTimeFormat} from './relative-time-ponyfill.js'

export type Format = 'auto' | 'micro' | string
export type Tense = 'auto' | 'past' | 'future'

export default class RelativeTime {
  date: Date
  locale: string

  constructor(date: Date, locale: string) {
    this.date = date
    this.locale = locale
  }

  timeAgo(): string | undefined {
    const ms = new Date().getTime() - this.date.getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (ms < 0) {
      return formatRelativeTime(this.locale, 0, 'second')
    } else if (sec < 10) {
      return formatRelativeTime(this.locale, 0, 'second')
    } else if (sec < 45) {
      return formatRelativeTime(this.locale, -sec, 'second')
    } else if (sec < 90) {
      return formatRelativeTime(this.locale, -min, 'minute')
    } else if (min < 45) {
      return formatRelativeTime(this.locale, -min, 'minute')
    } else if (min < 90) {
      return formatRelativeTime(this.locale, -hr, 'hour')
    } else if (hr < 24) {
      return formatRelativeTime(this.locale, -hr, 'hour')
    } else if (hr < 36) {
      return formatRelativeTime(this.locale, -day, 'day')
    } else if (day < 30) {
      return formatRelativeTime(this.locale, -day, 'day')
    } else if (month < 18) {
      return formatRelativeTime(this.locale, -month, 'month')
    } else {
      return formatRelativeTime(this.locale, -year, 'year')
    }
  }

  microTimeAgo(): string {
    const ms = new Date().getTime() - this.date.getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (min < 1) {
      return '1m'
    } else if (min < 60) {
      return `${min}m`
    } else if (hr < 24) {
      return `${hr}h`
    } else if (day < 365) {
      return `${day}d`
    } else {
      return `${year}y`
    }
  }

  timeUntil(): string {
    const ms = this.date.getTime() - new Date().getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (month >= 18) {
      return formatRelativeTime(this.locale, year, 'year')
    } else if (month >= 12) {
      return formatRelativeTime(this.locale, year, 'year')
    } else if (day >= 45) {
      return formatRelativeTime(this.locale, month, 'month')
    } else if (day >= 30) {
      return formatRelativeTime(this.locale, month, 'month')
    } else if (hr >= 36) {
      return formatRelativeTime(this.locale, day, 'day')
    } else if (hr >= 24) {
      return formatRelativeTime(this.locale, day, 'day')
    } else if (min >= 90) {
      return formatRelativeTime(this.locale, hr, 'hour')
    } else if (min >= 45) {
      return formatRelativeTime(this.locale, hr, 'hour')
    } else if (sec >= 90) {
      return formatRelativeTime(this.locale, min, 'minute')
    } else if (sec >= 45) {
      return formatRelativeTime(this.locale, min, 'minute')
    } else if (sec >= 10) {
      return formatRelativeTime(this.locale, sec, 'second')
    } else {
      return formatRelativeTime(this.locale, 0, 'second')
    }
  }

  microTimeUntil(): string {
    const ms = this.date.getTime() - new Date().getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (day >= 365) {
      return `${year}y`
    } else if (hr >= 24) {
      return `${day}d`
    } else if (min >= 60) {
      return `${hr}h`
    } else if (min > 1) {
      return `${min}m`
    } else {
      return '1m'
    }
  }
}

function formatRelativeTime(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  let formatter
  if ('Intl' in window && 'RelativeTimeFormat' in window.Intl) {
    try {
      formatter = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'})
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw e
      }
    }
  }
  formatter ||= new RelativeTimeFormat()
  return formatter.format(value, unit)
}
