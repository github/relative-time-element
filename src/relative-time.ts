import {strftime, makeFormatter, makeRelativeFormat, isDayFirst, isThisYear, isYearSeparator} from './utils'

export default class RelativeTime {
  date: Date
  locale: string

  constructor(date: Date, locale: string) {
    this.date = date
    this.locale = locale
  }

  toString(): string {
    const ago = this.timeElapsed()
    if (ago) {
      return ago
    } else {
      const ahead = this.timeAhead()
      if (ahead) {
        return ahead
      } else {
        return `on ${this.formatDate()}`
      }
    }
  }

  timeElapsed(): string | undefined | null {
    const ms = new Date().getTime() - this.date.getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    if (ms >= 0 && day < 30) {
      return this.timeAgoFromMs(ms)
    } else {
      return null
    }
  }

  timeAhead(): string | null {
    const ms = this.date.getTime() - new Date().getTime()
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    if (ms >= 0 && day < 30) {
      return this.timeUntil()
    } else {
      return null
    }
  }

  timeAgo(): string | undefined {
    const ms = new Date().getTime() - this.date.getTime()
    return this.timeAgoFromMs(ms)
  }

  timeAgoFromMs(ms: number): string | undefined {
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
    return this.timeUntilFromMs(ms)
  }

  timeUntilFromMs(ms: number): string {
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

  formatDate(): string {
    let format = isDayFirst() ? '%e %b' : '%b %e'
    if (!isThisYear(this.date)) {
      format += isYearSeparator() ? ', %Y' : ' %Y'
    }
    return strftime(this.date, format)
  }

  formatTime(): string {
    const formatter = timeFormatter()
    if (formatter) {
      return formatter.format(this.date)
    } else {
      return strftime(this.date, '%l:%M%P')
    }
  }
}

function formatRelativeTime(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit): string {
  const formatter = makeRelativeFormat(locale, {numeric: 'auto'})
  if (formatter) {
    return formatter.format(value, unit)
  } else {
    return formatEnRelativeTime(value, unit)
  }
}

// Simplified "en" RelativeTimeFormat.format function
//
// Values should roughly match
//   new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(value, unit)
//
function formatEnRelativeTime(value: number, unit: string): string {
  if (value === 0) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return `this ${unit}`
      case 'day':
        return 'today'
      case 'hour':
      case 'minute':
        return `in 0 ${unit}s`
      case 'second':
        return 'now'
    }
  } else if (value === 1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return `next ${unit}`
      case 'day':
        return 'tomorrow'
      case 'hour':
      case 'minute':
      case 'second':
        return `in 1 ${unit}`
    }
  } else if (value === -1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return `last ${unit}`
      case 'day':
        return 'yesterday'
      case 'hour':
      case 'minute':
      case 'second':
        return `1 ${unit} ago`
    }
  } else if (value > 1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
      case 'day':
      case 'hour':
      case 'minute':
      case 'second':
        return `in ${value} ${unit}s`
    }
  } else if (value < -1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
      case 'day':
      case 'hour':
      case 'minute':
      case 'second':
        return `${-value} ${unit}s ago`
    }
  }

  throw new RangeError(`Invalid unit argument for format() '${unit}'`)
}

const timeFormatter = makeFormatter({hour: 'numeric', minute: '2-digit'})
