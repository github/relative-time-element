import {strftime, makeFormatter, isDayFirst, isThisYear, isYearSeparator} from './utils'

export default class RelativeTime {
  constructor(date) {
    this.date = date
  }

  toString() {
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

  timeElapsed() {
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

  timeAhead() {
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

  timeAgo() {
    const ms = new Date().getTime() - this.date.getTime()
    return this.timeAgoFromMs(ms)
  }

  timeAgoFromMs(ms) {
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (ms < 0) {
      return 'just now'
    } else if (sec < 10) {
      return 'just now'
    } else if (sec < 45) {
      return `${sec} seconds ago`
    } else if (sec < 90) {
      return 'a minute ago'
    } else if (min < 45) {
      return `${min} minutes ago`
    } else if (min < 90) {
      return 'an hour ago'
    } else if (hr < 24) {
      return `${hr} hours ago`
    } else if (hr < 36) {
      return 'a day ago'
    } else if (day < 30) {
      return `${day} days ago`
    } else if (day < 45) {
      return 'a month ago'
    } else if (month < 12) {
      return `${month} months ago`
    } else if (month < 18) {
      return 'a year ago'
    } else {
      return `${year} years ago`
    }
  }

  microTimeAgo() {
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

  timeUntil() {
    const ms = this.date.getTime() - new Date().getTime()
    return this.timeUntilFromMs(ms)
  }

  timeUntilFromMs(ms) {
    const sec = Math.round(ms / 1000)
    const min = Math.round(sec / 60)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    const month = Math.round(day / 30)
    const year = Math.round(month / 12)
    if (month >= 18) {
      return `${year} years from now`
    } else if (month >= 12) {
      return 'a year from now'
    } else if (day >= 45) {
      return `${month} months from now`
    } else if (day >= 30) {
      return 'a month from now'
    } else if (hr >= 36) {
      return `${day} days from now`
    } else if (hr >= 24) {
      return 'a day from now'
    } else if (min >= 90) {
      return `${hr} hours from now`
    } else if (min >= 45) {
      return 'an hour from now'
    } else if (sec >= 90) {
      return `${min} minutes from now`
    } else if (sec >= 45) {
      return 'a minute from now'
    } else if (sec >= 10) {
      return `${sec} seconds from now`
    } else {
      return 'just now'
    }
  }

  microTimeUntil() {
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

  formatDate() {
    let format = isDayFirst() ? '%e %b' : '%b %e'
    if (!isThisYear(this.date)) {
      format += isYearSeparator() ? ', %Y' : ' %Y'
    }
    return strftime(this.date, format)
  }

  formatTime() {
    const formatter = makeFormatter({hour: 'numeric', minute: '2-digit'})
    if (formatter) {
      return formatter.format(this.date)
    } else {
      return strftime(this.date, '%l:%M%P')
    }
  }
}
