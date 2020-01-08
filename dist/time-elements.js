const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(num) {
  return "0".concat(num).slice(-2);
}

function strftime(time, formatString) {
  const day = time.getDay();
  const date = time.getDate();
  const month = time.getMonth();
  const year = time.getFullYear();
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  return formatString.replace(/%([%aAbBcdeHIlmMpPSwyYZz])/g, function (_arg) {
    let match;
    const modifier = _arg[1];

    switch (modifier) {
      case '%':
        return '%';

      case 'a':
        return weekdays[day].slice(0, 3);

      case 'A':
        return weekdays[day];

      case 'b':
        return months[month].slice(0, 3);

      case 'B':
        return months[month];

      case 'c':
        return time.toString();

      case 'd':
        return pad(date);

      case 'e':
        return String(date);

      case 'H':
        return pad(hour);

      case 'I':
        return pad(strftime(time, '%l'));

      case 'l':
        if (hour === 0 || hour === 12) {
          return String(12);
        } else {
          return String((hour + 12) % 12);
        }

      case 'm':
        return pad(month + 1);

      case 'M':
        return pad(minute);

      case 'p':
        if (hour > 11) {
          return 'PM';
        } else {
          return 'AM';
        }

      case 'P':
        if (hour > 11) {
          return 'pm';
        } else {
          return 'am';
        }

      case 'S':
        return pad(second);

      case 'w':
        return String(day);

      case 'y':
        return pad(year % 100);

      case 'Y':
        return String(year);

      case 'Z':
        match = time.toString().match(/\((\w+)\)$/);
        return match ? match[1] : '';

      case 'z':
        match = time.toString().match(/\w([+-]\d\d\d\d) /);
        return match ? match[1] : '';
    }

    return '';
  });
}
function makeFormatter(options) {
  let format;
  return function () {
    if (format) return format;

    if ('Intl' in window) {
      try {
        format = new Intl.DateTimeFormat(undefined, options);
        return format;
      } catch (e) {
        if (!(e instanceof RangeError)) {
          throw e;
        }
      }
    }
  };
}
let dayFirst = null;
const dayFirstFormatter = makeFormatter({
  day: 'numeric',
  month: 'short'
}); // Private: Determine if the day should be formatted before the month name in
// the user's current locale. For example, `9 Jun` for en-GB and `Jun 9`
// for en-US.
//
// Returns true if the day appears before the month.

function isDayFirst() {
  if (dayFirst !== null) {
    return dayFirst;
  }

  const formatter = dayFirstFormatter();

  if (formatter) {
    const output = formatter.format(new Date(0));
    dayFirst = !!output.match(/^\d/);
    return dayFirst;
  } else {
    return false;
  }
}
let yearSeparator = null;
const yearFormatter = makeFormatter({
  day: 'numeric',
  month: 'short',
  year: 'numeric'
}); // Private: Determine if the year should be separated from the month and day
// with a comma. For example, `9 Jun 2014` in en-GB and `Jun 9, 2014` in en-US.
//
// Returns true if the date needs a separator.

function isYearSeparator() {
  if (yearSeparator !== null) {
    return yearSeparator;
  }

  const formatter = yearFormatter();

  if (formatter) {
    const output = formatter.format(new Date(0));
    yearSeparator = !!output.match(/\d,/);
    return yearSeparator;
  } else {
    return true;
  }
} // Private: Determine if the date occurs in the same year as today's date.
//
// date - The Date to test.
//
// Returns true if it's this year.

function isThisYear(date) {
  const now = new Date();
  return now.getUTCFullYear() === date.getUTCFullYear();
}
function makeRelativeFormat(locale, options) {
  if ('Intl' in window && 'RelativeTimeFormat' in window.Intl) {
    try {
      // eslint-disable-next-line flowtype/no-flow-fix-me-comments
      // $FlowFixMe: missing RelativeTimeFormat type
      return new Intl.RelativeTimeFormat(locale, options);
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw e;
      }
    }
  }
} // Private: Get preferred Intl locale for a target element.
//
// Traverses parents until it finds an explicit `lang` other returns "default".

function localeFromElement(el) {
  const container = el.closest('[lang]');

  if (container instanceof HTMLElement && container.lang) {
    return container.lang;
  }

  return 'default';
}

const datetimes = new WeakMap();
class ExtendedTimeElement extends HTMLElement {
  static get observedAttributes() {
    return ['datetime', 'day', 'format', 'lang', 'hour', 'minute', 'month', 'second', 'title', 'weekday', 'year'];
  }

  connectedCallback() {
    const title = this.getFormattedTitle();

    if (title && !this.hasAttribute('title')) {
      this.setAttribute('title', title);
    }

    const text = this.getFormattedDate();

    if (text) {
      this.textContent = text;
    }
  } // Internal: Refresh the time element's formatted date when an attribute changes.


  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'datetime') {
      const millis = Date.parse(newValue);

      if (isNaN(millis)) {
        datetimes.delete(this);
      } else {
        datetimes.set(this, new Date(millis));
      }
    }

    const title = this.getFormattedTitle();

    if (title && !this.hasAttribute('title')) {
      this.setAttribute('title', title);
    }

    const text = this.getFormattedDate();

    if (text) {
      this.textContent = text;
    }
  }

  get date() {
    return datetimes.get(this);
  } // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.


  getFormattedTitle() {
    const date = this.date;
    if (!date) return;
    const formatter = titleFormatter();

    if (formatter) {
      return formatter.format(date);
    } else {
      try {
        return date.toLocaleString();
      } catch (e) {
        if (e instanceof RangeError) {
          return date.toString();
        } else {
          throw e;
        }
      }
    }
  }

  getFormattedDate() {}

}
const titleFormatter = makeFormatter({
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short'
});

const formatters = new WeakMap();
class LocalTimeElement extends ExtendedTimeElement {
  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'hour' || attrName === 'minute' || attrName === 'second' || attrName === 'time-zone-name') {
      formatters.delete(this);
    }

    super.attributeChangedCallback(attrName, oldValue, newValue);
  } // Formats the element's date, in the user's current locale, according to
  // the formatting attribute values. Values are not passed straight through to
  // an Intl.DateTimeFormat instance so that weekday and month names are always
  // displayed in English, for now.
  //
  // Supported attributes are:
  //
  //   weekday - "short", "long"
  //   year    - "numeric", "2-digit"
  //   month   - "short", "long"
  //   day     - "numeric", "2-digit"
  //   hour    - "numeric", "2-digit"
  //   minute  - "numeric", "2-digit"
  //   second  - "numeric", "2-digit"
  //
  // Returns a formatted time String.


  getFormattedDate() {
    const d = this.date;
    if (!d) return;
    const date = formatDate(this, d) || '';
    const time = formatTime(this, d) || '';
    return "".concat(date, " ").concat(time).trim();
  }

} // Private: Format a date according to the `weekday`, `day`, `month`,
// and `year` attribute values.
//
// This doesn't use Intl.DateTimeFormat to avoid creating text in the user's
// language when the majority of the surrounding text is in English. There's
// currently no way to separate the language from the format in Intl.
//
// el - The local-time element to format.
//
// Returns a date String or null if no date formats are provided.

function formatDate(el, date) {
  // map attribute values to strftime
  const props = {
    weekday: {
      short: '%a',
      long: '%A'
    },
    day: {
      numeric: '%e',
      '2-digit': '%d'
    },
    month: {
      short: '%b',
      long: '%B'
    },
    year: {
      numeric: '%Y',
      '2-digit': '%y'
    } // build a strftime format string

  };
  let format = isDayFirst() ? 'weekday day month year' : 'weekday month day, year';

  for (const prop in props) {
    const value = props[prop][el.getAttribute(prop)];
    format = format.replace(prop, value || '');
  } // clean up year separator comma


  format = format.replace(/(\s,)|(,\s$)/, ''); // squeeze spaces from final string

  return strftime(date, format).replace(/\s+/, ' ').trim();
} // Private: Format a time according to the `hour`, `minute`, and `second`
// attribute values.
//
// el - The local-time element to format.
//
// Returns a time String or null if no time formats are provided.


function formatTime(el, date) {
  const options = {}; // retrieve format settings from attributes

  const hour = el.getAttribute('hour');
  if (hour === 'numeric' || hour === '2-digit') options.hour = hour;
  const minute = el.getAttribute('minute');
  if (minute === 'numeric' || minute === '2-digit') options.minute = minute;
  const second = el.getAttribute('second');
  if (second === 'numeric' || second === '2-digit') options.second = second;
  const tz = el.getAttribute('time-zone-name');
  if (tz === 'short' || tz === 'long') options.timeZoneName = tz; // No time format attributes provided.

  if (Object.keys(options).length === 0) {
    return;
  }

  let factory = formatters.get(el);

  if (!factory) {
    factory = makeFormatter(options);
    formatters.set(el, factory);
  }

  const formatter = factory();

  if (formatter) {
    // locale-aware formatting of 24 or 12 hour times
    return formatter.format(date);
  } else {
    // fall back to strftime for non-Intl browsers
    const timef = options.second ? '%H:%M:%S' : '%H:%M';
    return strftime(date, timef);
  }
} // Public: LocalTimeElement constructor.
//
//   var time = new LocalTimeElement()
//   # => <local-time></local-time>
//


if (!window.customElements.get('local-time')) {
  window.LocalTimeElement = LocalTimeElement;
  window.customElements.define('local-time', LocalTimeElement);
}

class RelativeTime {
  constructor(date, locale) {
    this.date = date;
    this.locale = locale;
  }

  toString(format) {
    const ago = this.timeElapsed();

    if (ago) {
      return ago;
    }

    const ahead = this.timeAhead();

    if (ahead) {
      return ahead;
    }

    if (format) {
      return this.formatDate(format);
    }

    return "on ".concat(this.formatDate());
  }

  timeElapsed() {
    const ms = new Date().getTime() - this.date.getTime();
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);

    if (ms >= 0 && day < 30) {
      return this.timeAgoFromMs(ms);
    } else {
      return null;
    }
  }

  timeAhead() {
    const ms = this.date.getTime() - new Date().getTime();
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);

    if (ms >= 0 && day < 30) {
      return this.timeUntil();
    } else {
      return null;
    }
  }

  timeAgo() {
    const ms = new Date().getTime() - this.date.getTime();
    return this.timeAgoFromMs(ms);
  }

  timeAgoFromMs(ms) {
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const month = Math.round(day / 30);
    const year = Math.round(month / 12);

    if (ms < 0) {
      return formatRelativeTime(this.locale, 0, 'second');
    } else if (sec < 10) {
      return formatRelativeTime(this.locale, 0, 'second');
    } else if (sec < 45) {
      return formatRelativeTime(this.locale, -sec, 'second');
    } else if (sec < 90) {
      return formatRelativeTime(this.locale, -min, 'minute');
    } else if (min < 45) {
      return formatRelativeTime(this.locale, -min, 'minute');
    } else if (min < 90) {
      return formatRelativeTime(this.locale, -hr, 'hour');
    } else if (hr < 24) {
      return formatRelativeTime(this.locale, -hr, 'hour');
    } else if (hr < 36) {
      return formatRelativeTime(this.locale, -day, 'day');
    } else if (day < 30) {
      return formatRelativeTime(this.locale, -day, 'day');
    } else if (month < 12) {
      return formatRelativeTime(this.locale, -month, 'month');
    } else if (month < 18) {
      return formatRelativeTime(this.locale, -year, 'year');
    } else {
      return formatRelativeTime(this.locale, -year, 'year');
    }
  }

  microTimeAgo() {
    const ms = new Date().getTime() - this.date.getTime();
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const month = Math.round(day / 30);
    const year = Math.round(month / 12);

    if (min < 1) {
      return '1m';
    } else if (min < 60) {
      return "".concat(min, "m");
    } else if (hr < 24) {
      return "".concat(hr, "h");
    } else if (day < 365) {
      return "".concat(day, "d");
    } else {
      return "".concat(year, "y");
    }
  }

  timeUntil() {
    const ms = this.date.getTime() - new Date().getTime();
    return this.timeUntilFromMs(ms);
  }

  timeUntilFromMs(ms) {
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const month = Math.round(day / 30);
    const year = Math.round(month / 12);

    if (month >= 18) {
      return formatRelativeTime(this.locale, year, 'year');
    } else if (month >= 12) {
      return formatRelativeTime(this.locale, year, 'year');
    } else if (day >= 45) {
      return formatRelativeTime(this.locale, month, 'month');
    } else if (day >= 30) {
      return formatRelativeTime(this.locale, month, 'month');
    } else if (hr >= 36) {
      return formatRelativeTime(this.locale, day, 'day');
    } else if (hr >= 24) {
      return formatRelativeTime(this.locale, day, 'day');
    } else if (min >= 90) {
      return formatRelativeTime(this.locale, hr, 'hour');
    } else if (min >= 45) {
      return formatRelativeTime(this.locale, hr, 'hour');
    } else if (sec >= 90) {
      return formatRelativeTime(this.locale, min, 'minute');
    } else if (sec >= 45) {
      return formatRelativeTime(this.locale, min, 'minute');
    } else if (sec >= 10) {
      return formatRelativeTime(this.locale, sec, 'second');
    } else {
      return formatRelativeTime(this.locale, 0, 'second');
    }
  }

  microTimeUntil() {
    const ms = this.date.getTime() - new Date().getTime();
    const sec = Math.round(ms / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    const month = Math.round(day / 30);
    const year = Math.round(month / 12);

    if (day >= 365) {
      return "".concat(year, "y");
    } else if (hr >= 24) {
      return "".concat(day, "d");
    } else if (min >= 60) {
      return "".concat(hr, "h");
    } else if (min > 1) {
      return "".concat(min, "m");
    } else {
      return '1m';
    }
  }

  formatDate(defaultFormat) {
    let format = defaultFormat;

    if (format == null) {
      format = isDayFirst() ? '%e %b' : '%b %e';

      if (!isThisYear(this.date)) {
        format += isYearSeparator() ? ', %Y' : ' %Y';
      }
    }

    return strftime(this.date, format);
  }

  formatTime() {
    const formatter = timeFormatter();

    if (formatter) {
      return formatter.format(this.date);
    } else {
      return strftime(this.date, '%l:%M%P');
    }
  }

}

function formatRelativeTime(locale, value, unit) {
  const formatter = makeRelativeFormat(locale, {
    numeric: 'auto'
  });

  if (formatter) {
    return formatter.format(value, unit);
  } else {
    return formatEnRelativeTime(value, unit);
  }
} // Simplified "en" RelativeTimeFormat.format function
//
// Values should roughly match
//   new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(value, unit)
//


function formatEnRelativeTime(value, unit) {
  if (value === 0) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return "this ".concat(unit);

      case 'day':
        return 'today';

      case 'hour':
      case 'minute':
        return "in 0 ".concat(unit, "s");

      case 'second':
        return 'now';
    }
  } else if (value === 1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return "next ".concat(unit);

      case 'day':
        return 'tomorrow';

      case 'hour':
      case 'minute':
      case 'second':
        return "in 1 ".concat(unit);
    }
  } else if (value === -1) {
    switch (unit) {
      case 'year':
      case 'quarter':
      case 'month':
      case 'week':
        return "last ".concat(unit);

      case 'day':
        return 'yesterday';

      case 'hour':
      case 'minute':
      case 'second':
        return "1 ".concat(unit, " ago");
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
        return "in ".concat(value, " ").concat(unit, "s");
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
        return "".concat(-value, " ").concat(unit, "s ago");
    }
  }

  throw new RangeError("Invalid unit argument for format() '".concat(unit, "'"));
}

const timeFormatter = makeFormatter({
  hour: 'numeric',
  minute: '2-digit'
});

class RelativeTimeElement extends ExtendedTimeElement {
  getFormattedDate() {
    const date = this.date;

    if (date) {
      return new RelativeTime(date, localeFromElement(this)).toString(this.getAttribute('format'));
    }
  }

  connectedCallback() {
    nowElements.push(this);
    clearTimeout(updateNowElementsId);
    updateNowElements();
    super.connectedCallback();
  }

  disconnectedCallback() {
    const ix = nowElements.indexOf(this);

    if (ix !== -1) {
      nowElements.splice(ix, 1);
    }

    if (!nowElements.length) {
      if (updateNowElementsId) {
        clearTimeout(updateNowElementsId);
        updateNowElementsId = null;
      }
    }
  }

} // Internal: Array tracking all elements attached to the document that need
// to be updated continuously.

const nowElements = []; // Internal: Timer ID for `updateNowElements` interval.

let updateNowElementsId; // Internal: Get the abs distance between now and a date

function getDistance(date) {
  if (date == null) {
    return 1000;
  }

  return Math.abs(Date.now() - date.getTime());
} // Internal: Depending on ms distance, decide when we need the next update


function getNextUpdate(ms) {
  if (ms <= 10 * 1000) {
    return 1000;
  }

  if (ms <= 60 * 1000) {
    return 1000;
  }

  if (ms <= 60 * 60 * 1000) {
    return 60 * 1000;
  }

  return 10 * 60 * 1000;
} // Internal: Refresh all attached relative-time elements and set a new timeout
// for next run


function updateNowElements() {
  let nearestDistance;

  for (let i = 0, len = nowElements.length; i < len; i++) {
    const timeEl = nowElements[i],
          timeDistance = getDistance(timeEl.date),
          oldValue = timeEl.textContent,
          newValue = timeEl.getFormattedDate() || '';

    if (oldValue !== newValue) {
      timeEl.textContent = newValue;
      timeEl.dispatchEvent(new CustomEvent('relative-time-updated', {
        composed: true,
        detail: {
          oldValue,
          newValue
        }
      }));
    }

    if (nearestDistance == null || timeDistance < nearestDistance) {
      nearestDistance = timeDistance;
    }
  }

  if (nearestDistance != null) {
    updateNowElementsId = setTimeout(updateNowElements, getNextUpdate(nearestDistance));
  }
} // Public: RelativeTimeElement constructor.
//
//   var time = new RelativeTimeElement()
//   # => <relative-time></relative-time>
//


if (!window.customElements.get('relative-time')) {
  window.RelativeTimeElement = RelativeTimeElement;
  window.customElements.define('relative-time', RelativeTimeElement);
}

class TimeAgoElement extends RelativeTimeElement {
  getFormattedDate() {
    const format = this.getAttribute('format');
    const date = this.date;
    if (!date) return;

    if (format === 'micro') {
      return new RelativeTime(date, localeFromElement(this)).microTimeAgo();
    } else {
      return new RelativeTime(date, localeFromElement(this)).timeAgo();
    }
  }

}

if (!window.customElements.get('time-ago')) {
  window.TimeAgoElement = TimeAgoElement;
  window.customElements.define('time-ago', TimeAgoElement);
}

class TimeUntilElement extends RelativeTimeElement {
  getFormattedDate() {
    const format = this.getAttribute('format');
    const date = this.date;
    if (!date) return;

    if (format === 'micro') {
      return new RelativeTime(date, localeFromElement(this)).microTimeUntil();
    } else {
      return new RelativeTime(date, localeFromElement(this)).timeUntil();
    }
  }

}

if (!window.customElements.get('time-until')) {
  window.TimeUntilElement = TimeUntilElement;
  window.customElements.define('time-until', TimeUntilElement);
}

export { LocalTimeElement, RelativeTime, RelativeTimeElement, TimeAgoElement, TimeUntilElement };
