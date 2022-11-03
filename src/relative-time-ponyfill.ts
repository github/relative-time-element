export class RelativeTimeFormat implements Intl.RelativeTimeFormat {
  formatToParts() {
    return []
  }
  resolvedOptions() {
    return {locale: 'en', style: 'long', numeric: 'auto', numberingSystem: 'nu'} as const
  }
  // Simplified "en" RelativeTimeFormat.format function
  //
  // Values should roughly match
  //   new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(value, unit)
  //
  format(value: number, unit: string): string {
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
}
