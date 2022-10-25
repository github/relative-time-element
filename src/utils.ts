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
