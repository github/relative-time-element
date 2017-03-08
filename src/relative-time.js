import {strftime, makeFormatter, isDayFirst, isThisYear, isYearSeparator} from './utils'
import Internationalization from './internationalization'

export default class RelativeTime {
  constructor(date) {
    this.date = date
    this.translator = new Internationalization()
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
        return 'on ' + this.formatDate()
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
      return this.translator.t('just_now')
    } else if (sec < 10) {
      return this.translator.t('just_now')
    } else if (sec < 45) {
      return this.translator.t('seconds_ago', {count: sec})
    } else if (sec < 90) {
      return this.translator.t('minute_ago')
    } else if (min < 45) {
      return this.translator.t('minute_ago', {count: min})
    } else if (min < 90) {
      return this.translator.t('hour_ago')
    } else if (hr < 24) {
      return this.translator.t('hour_ago', {count: hr})
    } else if (hr < 36) {
      return this.translator.t('day_ago')
    } else if (day < 30) {
      return this.translator.t('day_ago', {count: day})
    } else if (day < 45) {
      return this.translator.t('month_ago')
    } else if (month < 12) {
      return this.translator.t('month_ago', {count: month})
    } else if (month < 18) {
      return this.translator.t('year_ago')
    } else {
      return this.translator.t('year_ago', {count: year})
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
      return min + 'm'
    } else if (hr < 24) {
      return hr + 'h'
    } else if (day < 365) {
      return day + 'd'
    } else {
      return year + 'y'
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
      return this.translator.t('year_from_now', {count: year})
    } else if (month >= 12) {
      return this.translator.t('year_from_now')
    } else if (day >= 45) {
      return this.translator.t('month_from_now', {count: year})
    } else if (day >= 30) {
      return this.translator.t('month_from_now')
    } else if (hr >= 36) {
      return this.translator.t('day_from_now', {count: day})
    } else if (hr >= 24) {
      return this.translator.t('day_from_now')
    } else if (min >= 90) {
      return this.translator.t('hour_from_now', {count: hr})
    } else if (min >= 45) {
      return this.translator.t('hour_from_now')
    } else if (sec >= 90) {
      return this.translator.t('minute_from_now', {count: min})
    } else if (sec >= 45) {
      return this.translator.t('minute_from_now')
    } else if (sec >= 10) {
      return this.translator.t('second_from_now', {count: sec})
    } else {
      return this.translator.t('just_now')
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
      return year + 'y'
    } else if (hr >= 24) {
      return day + 'd'
    } else if (min >= 60) {
      return hr + 'h'
    } else if (min > 1) {
      return min + 'm'
    } else {
      return '1m'
    }
  }

  formatDate() {
    let format = isDayFirst() ? '%e %b' : '%b %e'
    if (!isThisYear(this.date)) {
      format += isYearSeparator() ? ', %Y': ' %Y'
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
