const supportsIntlDatetime = 'Intl' in window && 'DateTimeFormat' in Intl

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export function strftime(time: Date, formatString: string, lang?: string): string {
  const day = time.getDay()
  const date = time.getDate()
  const month = time.getMonth()
  const year = time.getFullYear()
  const hour = time.getHours()
  const minute = time.getMinutes()
  const second = time.getSeconds()
  const useIntl = lang && supportsIntlDatetime
  const shortParts = useIntl && new Intl.DateTimeFormat(lang, {weekday: 'short', month: 'short'}).formatToParts(time)
  const longParts = useIntl && new Intl.DateTimeFormat(lang, {weekday: 'long', month: 'long'}).formatToParts(time)
  return formatString.replace(/%([%aAbBcdeHIlmMpPSwyYZz])/g, function (_arg) {
    let match
    const modifier = _arg[1]
    switch (modifier) {
      case '%':
        return '%'
      case 'a':
        if (shortParts) {
          const weekdayPart = shortParts.find(part => part.type === 'weekday')
          if (weekdayPart) return weekdayPart.value
        }
        return weekdays[day].slice(0, 3)
      case 'A':
        if (longParts) {
          const weekdayPart = longParts.find(part => part.type === 'weekday')
          if (weekdayPart) return weekdayPart.value
        }
        return weekdays[day]
      case 'b':
        if (shortParts) {
          const monthPart = shortParts.find(part => part.type === 'month')
          if (monthPart) return monthPart.value
        }
        return months[month].slice(0, 3)
      case 'B':
        if (longParts) {
          const monthPart = longParts.find(part => part.type === 'month')
          if (monthPart) return monthPart.value
        }
        return months[month]
      case 'c':
        return time.toString()
      case 'd':
        return String(date).padStart(2, '0')
      case 'e':
        return String(date)
      case 'H':
        return String(hour).padStart(2, '0')
      case 'I':
        if (hour === 0 || hour === 12) {
          return String(12)
        } else {
          return String((hour + 12) % 12).padStart(2, '0')
        }
      case 'l':
        if (hour === 0 || hour === 12) {
          return String(12)
        } else {
          return String((hour + 12) % 12).padStart(2, ' ')
        }
      case 'm':
        return String(month + 1).padStart(2, '0')
      case 'M':
        return String(minute).padStart(2, '0')
      case 'p':
        if (hour > 11) {
          return 'PM'
        } else {
          return 'AM'
        }
      case 'P':
        if (hour > 11) {
          return 'pm'
        } else {
          return 'am'
        }
      case 'S':
        return String(second).padStart(2, '0')
      case 'w':
        return String(day)
      case 'y':
        return String(year % 100).padStart(2, '0')
      case 'Y':
        return String(year)
      case 'Z':
        match = time.toString().match(/\((\w+)\)$/)
        return match ? match[1] : ''
      case 'z':
        match = time.toString().match(/\w([+-]\d\d\d\d) /)
        return match ? match[1] : ''
    }
    return ''
  })
}
