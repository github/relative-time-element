import i18next from 'i18next'

export default class {
  constructor() {
    i18next.init({
      lng: 'en',
      resources: this.translations()
    })
  }

  t(key, options) {
    return i18next.t(key, options)
  }

  translations() {
    return {
      en: {
        translation: {
          "just_now":                "just now",
          "second_ago_plural":       "{{count}} seconds ago",
          "minute_ago":              "a minute ago",
          "minute_ago_plural":       "{{count}} minutes ago",
          "hour_ago":                "an hour ago",
          "hour_ago_plural":         "{{count}} hours ago",
          "day_ago":                 "a day ago",
          "day_ago_plural":          "{{count}} days ago",
          "month_ago":               "a month ago",
          "month_ago_plural":        "{{count}} months ago",
          "year_ago":                "a year ago",
          "year_ago_plural":         "{{count}} years ago",
          "year_from_now":           "a year from now",
          "year_from_now_plural":    "{{count}} years from now",
          "month_from_now":          "a month from now",
          "month_from_now_plural":   "{{count}} months from now",
          "day_from_now":            "a day from now",
          "day_from_now_plural":     "{{count}} days from now",
          "hour_from_now":           "a hour from now",
          "hour_from_now_plural":    "{{count}} hours from now",
          "minute_from_now":         "a minute from now",
          "minute_from_now_plural":  "{{count}} minutes from now",
          "seconds_from_now_plural": "{{count}} seconds from now"
        }
      }
    }
  }
}
