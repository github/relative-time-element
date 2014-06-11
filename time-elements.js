(function() {
  'use strict';

  // Shout out to https://github.com/basecamp/local_time/blob/master/app/assets/javascripts/local_time.js.coffee
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(num) {
    return ('0' + num).slice(-2);
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


  function CalendarDate(year, month, day) {
    this.date = new Date(Date.UTC(year, month - 1));
    this.date.setUTCDate(day);
    this.year = this.date.getUTCFullYear();
    this.month = this.date.getUTCMonth() + 1;
    this.day = this.date.getUTCDate();
    this.value = this.date.getTime();
  }

  CalendarDate.fromDate = function(date) {
    return new this(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  CalendarDate.today = function() {
    return this.fromDate(new Date());
  };

  CalendarDate.prototype.equals = function(calendarDate) {
    return (calendarDate != null ? calendarDate.value : void 0) === this.value;
  };

  CalendarDate.prototype.isToday = function() {
    return this.equals(CalendarDate.today());
  };

  CalendarDate.prototype.occursOnSameYearAs = function(date) {
    return this.year === (date != null ? date.year : void 0);
  };

  CalendarDate.prototype.occursThisYear = function() {
    return this.occursOnSameYearAs(CalendarDate.today());
  };

  CalendarDate.prototype.daysSince = function(date) {
    if (date) {
      return (this.date - date.date) / (1000 * 60 * 60 * 24);
    }
  };

  CalendarDate.prototype.daysPassed = function() {
    return CalendarDate.today().daysSince(this);
  };


  function RelativeTime(date) {
    this.date = date;
    this.calendarDate = CalendarDate.fromDate(this.date);
  }

  RelativeTime.prototype.toString = function() {
    var ago, day;
    if (ago = this.timeElapsed()) {
      return ago;
    } else if (day = this.relativeWeekday()) {
      return day + ' at ' + this.formatTime();
    } else {
      return 'on ' + this.formatDate();
    }
  };

  RelativeTime.prototype.toTimeOrDateString = function() {
    if (this.calendarDate.isToday()) {
      return this.formatTime();
    } else {
      return this.formatDate();
    }
  };

  RelativeTime.prototype.timeElapsed = function() {
    var ms = new Date().getTime() - this.date.getTime();
    var sec = Math.round(ms / 1000);
    var min = Math.round(sec / 60);
    var hr = Math.round(min / 60);
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
    } else {
      return null;
    }
  };

  RelativeTime.prototype.timeAgo = function() {
    var ms = new Date().getTime() - this.date.getTime();
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

  RelativeTime.prototype.relativeWeekday = function() {
    var daysPassed = this.calendarDate.daysPassed();
    if (daysPassed > 6) {
      return null;
    } else if (daysPassed === 0) {
      return 'today';
    } else if (daysPassed === 1) {
      return 'yesterday';
    } else {
      return strftime(this.date, '%A');
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

    if (!('Intl' in window)) {
      return false;
    }

    var options = {day: 'numeric', month: 'short'};
    var formatter = new window.Intl.DateTimeFormat(undefined, options);
    var output = formatter.format(new Date(0));

    dayFirst = !!output.match(/^\d/);
    return dayFirst;
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

    if (!('Intl' in window)) {
      return true;
    }

    var options = {day: 'numeric', month: 'short', year: 'numeric'};
    var formatter = new window.Intl.DateTimeFormat(undefined, options);
    var output = formatter.format(new Date(0));

    yearSeparator = !!output.match(/\d,/);
    return yearSeparator;
  }
  var yearSeparator = null;

  RelativeTime.prototype.formatDate = function() {
    var format = isDayFirst() ? '%e %b' : '%b %e';
    if (!this.calendarDate.occursThisYear()) {
      format += isYearSeparator() ? ', %Y': ' %Y';
    }
    return strftime(this.date, format);
  };

  RelativeTime.prototype.formatTime = function() {
    if ('Intl' in window) {
      var formatter = new window.Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'});
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


  var ExtendedTimePrototype;
  if ('HTMLTimeElement' in window) {
    ExtendedTimePrototype = Object.create(window.HTMLTimeElement.prototype);
  } else {
    ExtendedTimePrototype = Object.create(window.HTMLElement.prototype);
  }

  // Internal: Refresh the time element's formatted date when an attribute changes.
  //
  // Returns nothing.
  ExtendedTimePrototype.attributeChangedCallback = function(attrName, oldValue, newValue) {
    if (attrName === 'datetime') {
      this._date = new Date(Date.parse(newValue));
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

    if ('Intl' in window) {
      var options = {day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'};
      var formatter = new window.Intl.DateTimeFormat(undefined, options);
      return formatter.format(this._date);
    }

    return this._date.toLocaleString();
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
      return new RelativeTime(this._date).timeAgo();
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
  //   weekday - Possible values are "short", "long".
  //   year    - Possible values are "numeric", "2-digit".
  //   month   - Possible values are "short", "long".
  //   day     - Possible values are "numeric", "2-digit".
  //   hour    - Possible values are "numeric", "2-digit".
  //   minute  - Possible values are "numeric", "2-digit".
  //   second  - Possible values are "numeric", "2-digit".
  //
  // Returns a formatted time String.
  LocalTimePrototype.getFormattedDate = function() {
    if (!this._date) {
      return;
    }

    if (!('Intl' in window)) {
      return;
    }

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

    var format = isDayFirst() ? 'weekday day month year' : 'weekday month day, year';
    for (var prop in props) {
      var value = props[prop][this.getAttribute(prop)];
      format = format.replace(prop, value || '');
    }
    format = format.replace(/(\s,)|(,\s$)/, '');

    var options = {
      hour: this.getAttribute('hour'),
      minute: this.getAttribute('minute'),
      second: this.getAttribute('second')
    };

    for (var opt in options) {
      if (!options[opt]) {
        delete options[opt];
      }
    }

    var time = '';
    if (Object.keys(options).length > 0) {
      var formatter = new window.Intl.DateTimeFormat(undefined, options);
      time = formatter.format(this._date);
    }

    var date = strftime(this._date, format) + ' ' + time;
    return date.replace(/\s+/, ' ').trim();
  };


  // Public: RelativeTimeElement constructor.
  //
  //   var time = new RelativeTimeElement()
  //   # => <time is='relative-time'></time>
  //
  window.RelativeTimeElement = document.registerElement('relative-time', {
    prototype: RelativeTimePrototype,
    'extends': 'time'
  });

  window.TimeAgoElement = document.registerElement('time-ago', {
    prototype: TimeAgoPrototype,
    'extends': 'time'
  });

  // Public: LocalTimeElement constructor.
  //
  //   var time = new LocalTimeElement()
  //   # => <time is='local-time'></time>
  //
  window.LocalTimeElement = document.registerElement('local-time', {
    prototype: LocalTimePrototype,
    'extends': 'time'
  });

})();
