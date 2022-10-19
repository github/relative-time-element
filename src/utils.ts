export function makeFormatter(
  options: Intl.DateTimeFormatOptions
): (locale?: string) => Intl.DateTimeFormat | undefined {
  return function (locale?: string): Intl.DateTimeFormat | undefined {
    if ('Intl' in window) {
      try {
        return new Intl.DateTimeFormat(locale, options)
      } catch (e) {
        if (!(e instanceof RangeError)) {
          throw e
        }
      }
    }
  }
}

const dayFirst: Record<string, boolean> = {}
const dayFirstFormatter = makeFormatter({day: 'numeric', month: 'short'})

// Private: Determine if the day should be formatted before the month name in
// the user's current locale. For example, `9 Jun` for en-GB and `Jun 9`
// for en-US.
//
// Returns true if the day appears before the month.
export function isDayFirst(locale = 'default'): boolean {
  if (locale in dayFirst) {
    return dayFirst[locale]
  }

  const formatter = dayFirstFormatter(locale)
  if (formatter) {
    const output = formatter.format(new Date(0))
    dayFirst[locale] = !!output.match(/^\d/)
    return dayFirst[locale]
  } else {
    return false
  }
}

let yearSeparator: boolean | null = null
const yearFormatter = makeFormatter({day: 'numeric', month: 'short', year: 'numeric'})

// Private: Determine if the year should be separated from the month and day
// with a comma. For example, `9 Jun 2014` in en-GB and `Jun 9, 2014` in en-US.
//
// Returns true if the date needs a separator.
export function isYearSeparator(): boolean {
  if (yearSeparator !== null) {
    return yearSeparator
  }

  const formatter = yearFormatter()
  if (formatter) {
    const output = formatter.format(new Date(0))
    yearSeparator = !!output.match(/\d,/)
    return yearSeparator
  } else {
    return true
  }
}

// Private: Determine if the date occurs in the same year as today's date.
//
// date - The Date to test.
//
// Returns true if it's this year.
export function isThisYear(date: Date): boolean {
  const now = new Date()
  return now.getUTCFullYear() === date.getUTCFullYear()
}

export function makeRelativeFormat(
  locale: string,
  options: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat | void {
  if ('Intl' in window && 'RelativeTimeFormat' in window.Intl) {
    try {
      return new Intl.RelativeTimeFormat(locale, options)
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw e
      }
    }
  }
}

// Private: Get preferred Intl locale for a target element.
//
// Traverses parents until it finds an explicit `lang` other returns "default".
export function localeFromElement(el: HTMLElement): string {
  const container = el.closest('[lang]')
  if (container instanceof HTMLElement && container.lang) {
    return container.lang
  }
  return 'default'
}
