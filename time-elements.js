(function() {
  'use strict';

  // Shout out to https://github.com/basecamp/local_time/blob/master/app/assets/javascripts/local_time.js.coffee
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(num) {
    return ('0' + num).slice(-2);
  }

  function makeFormatter(options) {
    if ('Intl' in window) {
      try {
        return new window.Intl.DateTimeFormat(undefined, options);
      } catch (e) {
        if (!(e instanceof RangeError)) {
          throw e;
        }
      }
    }
  }

  function strftime(time, formatString) {
    var day = time.getDay();
    var date = time.getDate();
    var month = time.getMonth();
    var year = time.getFullYear();
    var hour = time.getHours();
    var minute = time.getMinutes();
    var second = time.getSeconds();
    return formatString.replace(/%([%aAbBcdeHIlmMpPSwyYZz])/g, function(_arg) {
      var match;
      var modifier = _arg[1];
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
          return date;
        case 'H':
          return pad(hour);
        case 'I':
          return pad(strftime(time, '%l'));
        case 'l':
          if (hour === 0 || hour === 12) {
            return 12;
          } else {
            return (hour + 12) % 12;
          }
          break;
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
          break;
        case 'P':
          if (hour > 11) {
            return 'pm';
          } else {
            return 'am';
          }
          break;
        case 'S':
          return pad(second);
        case 'w':
          return day;
        case 'y':
          return pad(year % 100);
        case 'Y':
          return year;
        case 'Z':
          match = time.toString().match(/\((\w+)\)$/);
          return match ? match[1] : '';
        case 'z':
          match = time.toString().match(/\w([+-]\d\d\d\d) /);
          return match ? match[1] : '';
      }
    });
  }

  function RelativeTime(date) {
    this.date = date;
  }

  RelativeTime.prototype.toString = function() {
    var ago = this.timeElapsed();
    if (ago) {
      return ago;
    } else {
      var ahead = this.timeAhead();
      if (ahead) {
        return ahead;
      } else {
        return 'on ' + this.formatDate();
      }
    }
  };

  RelativeTime.prototype.timeElapsed = function() {
    var ms = new Date().getTime() - this.date.getTime();
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    if (ms >= 0 && day < 30) {
      return this.timeAgoFromMs(ms);
    }
    else {
      return null;
    }
  };

  RelativeTime.prototype.timeAhead = function() {
    var ms = this.date.getTime() - (new Date().getTime());
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    if (ms >= 0 && day < 30) {
      return this.timeUntil();
    }
    else {
      return null;
    }
  };

  RelativeTime.prototype.timeAgo = function() {
    var ms = new Date().getTime() - this.date.getTime();
    return this.timeAgoFromMs(ms);
  };

  RelativeTime.prototype.timeAgoFromMs = function(ms) {
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    var month = Math.round(day / 30);
    var year = Math.round(month / 12);
    if (ms < 0) {
      return 'just now';
    } else if (sec < 10) {
      return 'just now';
    } else if (sec < 45) {
      return sec + ' seconds ago';
    } else if (sec < 90) {
      return 'a minute ago';
    } else if (min < 45) {
      return min + ' minutes ago';
    } else if (min < 90) {
      return 'an hour ago';
    } else if (hr < 24) {
      return hr + ' hours ago';
    } else if (hr < 36) {
      return 'a day ago';
    } else if (day < 30) {
      return day + ' days ago';
    } else if (day < 45) {
      return 'a month ago';
    } else if (month < 12) {
      return month + ' months ago';
    } else if (month < 18) {
        return 'a year ago';
    } else {
      return year + ' years ago';
    }
  };

  RelativeTime.prototype.microTimeAgo = function() {
    var ms = new Date().getTime() - this.date.getTime();
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    var month = Math.round(day / 30);
    var year = Math.round(month / 12);
    if (min < 1) {
      return '1m';
    } else if (min < 60) {
      return min + 'm';
    } else if (hr < 24) {
      return hr + 'h';
    } else if (day < 365) {
      return day + 'd';
    } else {
      return year + 'y';
    }
  };

  RelativeTime.prototype.timeUntil = function() {
    var ms = this.date.getTime() - (new Date().getTime());
    return this.timeUntilFromMs(ms);
  };

  RelativeTime.prototype.timeUntilFromMs = function(ms) {
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    var month = Math.round(day / 30);
    var year = Math.round(month / 12);
    if (month >= 18) {
      return year + ' years from now';
    } else if (month >= 12) {
      return 'a year from now';
    } else if (day >= 45) {
      return month + ' months from now';
    } else if (day >= 30) {
      return 'a month from now';
    } else if (hr >= 36) {
      return day + ' days from now';
    } else if (hr >= 24) {
      return 'a day from now';
    } else if (min >= 90) {
      return hr + ' hours from now';
    } else if (min >= 45) {
      return 'an hour from now';
    } else if (sec >= 90) {
      return min + ' minutes from now';
    } else if (sec >= 45) {
      return 'a minute from now';
    } else if (sec >= 10) {
      return sec + ' seconds from now';
    } else {
      return 'just now';
    }
  };

  RelativeTime.prototype.microTimeUntil = function() {
    var ms = this.date.getTime() - (new Date().getTime());
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
    var day = Math.round(hr / 24);
    var month = Math.round(day / 30);
    var year = Math.round(month / 12);
    if (day >= 365) {
      return year + 'y';
    } else if (hr >= 24) {
      return day + 'd';
    } else if (min >= 60) {
      return hr + 'h';
    } else if (min > 1) {
      return min + 'm';
    } else {
      return '1m';
    }
  };

  // Private: Determine if the day should be formatted before the month name in
  // the user's current locale. For example, `9 Jun` for en-GB and `Jun 9`
  // for en-US.
  //
  // Returns true if the day appears before the month.
  function isDayFirst() {
    if (dayFirst !== null) {
      return dayFirst;
    }

    var formatter = makeFormatter({day: 'numeric', month: 'short'});
    if (formatter) {
      var output = formatter.format(new Date(0));
      dayFirst = !!output.match(/^\d/);
      return dayFirst;
    } else {
      return false;
    }
  }
  var dayFirst = null;

  // Private: Determine if the year should be separated from the month and day
  // with a comma. For example, `9 Jun 2014` in en-GB and `Jun 9, 2014` in en-US.
  //
  // Returns true if the date needs a separator.
  function isYearSeparator() {
    if (yearSeparator !== null) {
      return yearSeparator;
    }

    var formatter = makeFormatter({day: 'numeric', month: 'short', year: 'numeric'});
    if (formatter) {
      var output = formatter.format(new Date(0));
      yearSeparator = !!output.match(/\d,/);
      return yearSeparator;
    } else {
      return true;
    }
  }
  var yearSeparator = null;

  // Private: Determine if the date occurs in the same year as today's date.
  //
  // date - The Date to test.
  //
  // Returns true if it's this year.
  function isThisYear(date) {
    var now = new Date();
    return now.getUTCFullYear() === date.getUTCFullYear();
  }

  RelativeTime.prototype.formatDate = function() {
    var format = isDayFirst() ? '%e %b' : '%b %e';
    if (!isThisYear(this.date)) {
      format += isYearSeparator() ? ', %Y': ' %Y';
    }
    return strftime(this.date, format);
  };

  RelativeTime.prototype.formatTime = function() {
    var formatter = makeFormatter({hour: 'numeric', minute: '2-digit'});
    if (formatter) {
      return formatter.format(this.date);
    } else {
      return strftime(this.date, '%l:%M%P');
    }
  };


  // Internal: Array tracking all elements attached to the document that need
  // to be updated every minute.
  var nowElements = [];

  // Internal: Timer ID for `updateNowElements` interval.
  var updateNowElementsId;

  // Internal: Install a timer to refresh all attached relative-time elements every
  // minute.
  function updateNowElements() {
    var time, i, len;
    for (i = 0, len = nowElements.length; i < len; i++) {
      time = nowElements[i];
      time.textContent = time.getFormattedDate();
    }
  }


  var ExtendedTimePrototype = Object.create(window.HTMLElement.prototype);

  // Internal: Refresh the time element's formatted date when an attribute changes.
  //
  // Returns nothing.
  ExtendedTimePrototype.attributeChangedCallback = function(attrName, oldValue, newValue) {
    if (attrName === 'datetime') {
      var millis = Date.parse(newValue);
      this._date = isNaN(millis) ? null : new Date(millis);
    }

    var title = this.getFormattedTitle();
    if (title) {
      this.setAttribute('title', title);
    }

    var text = this.getFormattedDate();
    if (text) {
      this.textContent = text;
    }
  };

  // Internal: Format the ISO 8601 timestamp according to the user agent's
  // locale-aware formatting rules. The element's existing `title` attribute
  // value takes precedence over this custom format.
  //
  // Returns a formatted time String.
  ExtendedTimePrototype.getFormattedTitle = function() {
    if (!this._date) {
      return;
    }

    if (this.hasAttribute('title')) {
      return this.getAttribute('title');
    }

    var formatter = makeFormatter({day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'});
    if (formatter) {
      return formatter.format(this._date);
    } else {
      try {
        return this._date.toLocaleString();
      } catch(e) {
        if (e instanceof RangeError) {
          return this._date.toString();
        } else {
          throw e;
        }
      }
    }
  };


  var RelativeTimePrototype = Object.create(ExtendedTimePrototype);

  RelativeTimePrototype.createdCallback = function() {
    var value = this.getAttribute('datetime');
    if (value) {
      this.attributeChangedCallback('datetime', null, value);
    }
  };

  RelativeTimePrototype.getFormattedDate = function() {
    if (this._date) {
      return new RelativeTime(this._date).toString();
    }
  };

  RelativeTimePrototype.attachedCallback = function() {
    nowElements.push(this);

    if (!updateNowElementsId) {
      updateNowElements();
      updateNowElementsId = setInterval(updateNowElements, 60 * 1000);
    }
  };

  RelativeTimePrototype.detachedCallback = function() {
    var ix = nowElements.indexOf(this);
    if (ix !== -1) {
      nowElements.splice(ix, 1);
    }

    if (!nowElements.length) {
      if (updateNowElementsId) {
        clearInterval(updateNowElementsId);
        updateNowElementsId = null;
      }
    }
  };

  var TimeAgoPrototype = Object.create(RelativeTimePrototype);
  TimeAgoPrototype.getFormattedDate = function() {
    if (this._date) {
      var format = this.getAttribute('format');
      if (format === 'micro') {
        return new RelativeTime(this._date).microTimeAgo();
      } else {
        return new RelativeTime(this._date).timeAgo();
      }
    }
  };

  var TimeUntilPrototype = Object.create(RelativeTimePrototype);
  TimeUntilPrototype.getFormattedDate = function() {
    if (this._date) {
      var format = this.getAttribute('format');
      if (format === 'micro') {
        return new RelativeTime(this._date).microTimeUntil();
      } else {
        return new RelativeTime(this._date).timeUntil();
      }
    }
  };


  var LocalTimePrototype = Object.create(ExtendedTimePrototype);

  LocalTimePrototype.createdCallback = function() {
    var value;
    if (value = this.getAttribute('datetime')) {
      this.attributeChangedCallback('datetime', null, value);
    }
    if (value = this.getAttribute('format')) {
      this.attributeChangedCallback('format', null, value);
    }
  };

  // Formats the element's date, in the user's current locale, according to
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
  LocalTimePrototype.getFormattedDate = function() {
    if (!this._date) {
      return;
    }

    var date = formatDate(this) || '';
    var time = formatTime(this) || '';
    return (date + ' ' + time).trim();
  };

  // Private: Format a date according to the `weekday`, `day`, `month`,
  // and `year` attribute values.
  //
  // This doesn't use Intl.DateTimeFormat to avoid creating text in the user's
  // language when the majority of the surrounding text is in English. There's
  // currently no way to separate the language from the format in Intl.
  //
  // el - The local-time element to format.
  //
  // Returns a date String or null if no date formats are provided.
  function formatDate(el) {
    // map attribute values to strftime
    var props = {
      weekday: {
        'short': '%a',
        'long': '%A'
      },
      day: {
        'numeric': '%e',
        '2-digit': '%d'
      },
      month: {
        'short': '%b',
        'long': '%B'
      },
      year: {
        'numeric': '%Y',
        '2-digit': '%y'
      }
    };

    // build a strftime format string
    var format = isDayFirst() ? 'weekday day month year' : 'weekday month day, year';
    for (var prop in props) {
      var value = props[prop][el.getAttribute(prop)];
      format = format.replace(prop, value || '');
    }

    // clean up year separator comma
    format = format.replace(/(\s,)|(,\s$)/, '');

    // squeeze spaces from final string
    return strftime(el._date, format).replace(/\s+/, ' ').trim();
  }

  // Private: Format a time according to the `hour`, `minute`, and `second`
  // attribute values.
  //
  // el - The local-time element to format.
  //
  // Returns a time String or null if no time formats are provided.
  function formatTime(el) {
    // retrieve format settings from attributes
    var options = {
      hour: el.getAttribute('hour'),
      minute: el.getAttribute('minute'),
      second: el.getAttribute('second')
    };

    // remove unset format attributes
    for (var opt in options) {
      if (!options[opt]) {
        delete options[opt];
      }
    }

    // no time format attributes provided
    if (Object.keys(options).length === 0) {
      return;
    }

    var formatter = makeFormatter(options);
    if (formatter) {
      // locale-aware formatting of 24 or 12 hour times
      return formatter.format(el._date);
    } else {
      // fall back to strftime for non-Intl browsers
      var timef = options.second ? '%H:%M:%S' : '%H:%M';
      return strftime(el._date, timef);
    }
  }

  // Public: RelativeTimeElement constructor.
  //
  //   var time = new RelativeTimeElement()
  //   # => <relative-time></relative-time>
  //
  window.RelativeTimeElement = document.registerElement('relative-time', {
    prototype: RelativeTimePrototype
  });

  window.TimeAgoElement = document.registerElement('time-ago', {
    prototype: TimeAgoPrototype
  });

  window.TimeUntilElement = document.registerElement('time-until', {
    prototype: TimeUntilPrototype
  });

  // Public: LocalTimeElement constructor.
  //
  //   var time = new LocalTimeElement()
  //   # => <local-time></local-time>
  //
  window.LocalTimeElement = document.registerElement('local-time', {
    prototype: LocalTimePrototype
  });

})();
