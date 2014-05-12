(function() {
  'use strict';

  // Shout out to https://github.com/basecamp/local_time/blob/master/app/assets/javascripts/local_time.js.coffee
  var LocalTime = (function() {
    var weekdays = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");

    var months = "January February March April May June July August September October November December".split(" ");

    var pad = function(num) {
      return ('0' + num).slice(-2);
    };

    var strftime = function(time, formatString) {
      var day = time.getDay();
      var date = time.getDate();
      var month = time.getMonth();
      var year = time.getFullYear();
      var hour = time.getHours();
      var minute = time.getMinutes();
      var second = time.getSeconds();
      return formatString.replace(/%([%aAbBcdeHIlmMpPSwyYZ])/g, function(_arg) {
        var _ref, _ref1;
        var match = _arg[0]
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
            return day;
          case 'y':
            return pad(year % 100);
          case 'Y':
            return year;
          case 'Z':
            return (_ref = (_ref1 = time.toString().match(/\((\w+)\)$/)) != null ? _ref1[1] : void 0) != null ? _ref : '';
        }
      });
    };

    var CalendarDate;
    CalendarDate = (function() {
      CalendarDate.fromDate = function(date) {
        return new this(date.getFullYear(), date.getMonth() + 1, date.getDate());
      };

      CalendarDate.today = function() {
        return this.fromDate(new Date);
      };

      function CalendarDate(year, month, day) {
        this.date = new Date(Date.UTC(year, month - 1));
        this.date.setUTCDate(day);
        this.year = this.date.getUTCFullYear();
        this.month = this.date.getUTCMonth() + 1;
        this.day = this.date.getUTCDate();
        this.value = this.date.getTime();
      }

      CalendarDate.prototype.equals = function(calendarDate) {
        return (calendarDate != null ? calendarDate.value : void 0) === this.value;
      };

      CalendarDate.prototype.is = function(calendarDate) {
        return this.equals(calendarDate);
      };

      CalendarDate.prototype.isToday = function() {
        return this.is(this.constructor.today());
      };

      CalendarDate.prototype.occursOnSameYearAs = function(date) {
        return this.year === (date != null ? date.year : void 0);
      };

      CalendarDate.prototype.occursThisYear = function() {
        return this.occursOnSameYearAs(this.constructor.today());
      };

      CalendarDate.prototype.daysSince = function(date) {
        if (date) {
          return (this.date - date.date) / (1000 * 60 * 60 * 24);
        }
      };

      CalendarDate.prototype.daysPassed = function() {
        return this.constructor.today().daysSince(this);
      };

      return CalendarDate;
    })();

    var RelativeTime;
    RelativeTime = (function() {
      function RelativeTime(date) {
        this.date = date;
        this.calendarDate = CalendarDate.fromDate(this.date);
      }

      RelativeTime.prototype.toString = function() {
        var ago, day;
        if (ago = this.timeElapsed()) {
          return ago;
        } else if (day = this.relativeWeekday()) {
          return "" + day + " at " + (this.formatTime());
        } else {
          return "on " + (this.formatDate());
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
          return "just now";
        } else if (sec < 10) {
          return "just now";
        } else if (sec < 45) {
          return "" + sec + " seconds ago";
        } else if (sec < 90) {
          return "a minute ago";
        } else if (min < 45) {
          return "" + min + " minutes ago";
        } else if (min < 90) {
          return "an hour ago";
        } else if (hr < 24) {
          return "" + hr + " hours ago";
        } else {
          return null;
        }
      };

      RelativeTime.prototype.relativeWeekday = function() {
        var daysPassed = this.calendarDate.daysPassed();
        if (daysPassed > 6) {
          return null;
        } else if (daysPassed === 0) {
          return "today";
        } else if (daysPassed === 1) {
          return "yesterday";
        } else {
          return strftime(this.date, "%A");
        }
      };

      RelativeTime.prototype.formatDate = function() {
        var format = "%b %e";
        if (!this.calendarDate.occursThisYear()) {
          format += ", %Y";
        }
        return strftime(this.date, format);
      };

      RelativeTime.prototype.formatTime = function() {
        return strftime(this.date, '%l:%M%P');
      };

      return RelativeTime;
    })();

    var LocalTime = {
      relativeDate: function(date) {
        return new RelativeTime(date).formatDate();
      },
      relativeTimeAgo: function(date) {
        return new RelativeTime(date).toString();
      },
      relativeTimeOrDate: function(date) {
        return new RelativeTime(date).toTimeOrDateString();
      },
      relativeWeekday: function(date) {
        var day;
        if (day = new RelativeTime(date).relativeWeekday()) {
          return day.charAt(0).toUpperCase() + day.substring(1);
        }
      },
      strftime: strftime
    };

    return LocalTime;
  })();


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

  // Internal: Refresh the time element's formatted date when an attribute changes.
  //
  // Returns nothing.
  function attributeChanged(attrName, oldValue, newValue) {
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

  // Internal: Format the ISO 8601 timestamp according to the strftime format
  // string assigned to the time element's `title-format` attribute.
  //
  // Returns a formatted time String or null if no title-format attribute is set.
  function formattedTitle() {
    if (this._date && this.hasAttribute('title-format')) {
      return LocalTime.strftime(this._date, this.getAttribute('title-format'));
    }
  };


  var parent = HTMLElement;
  if ('HTMLTimeElement' in window) {
    parent = HTMLTimeElement;
  }

  var RelativeTimePrototype = Object.create(parent.prototype);

  RelativeTimePrototype.attributeChangedCallback = attributeChanged;

  RelativeTimePrototype.getFormattedTitle = formattedTitle;

  RelativeTimePrototype.createdCallback = function() {
    var value = this.getAttribute('datetime');
    if (value) {
      this.attributeChangedCallback('datetime', null, value);
    }
  };

  RelativeTimePrototype.getFormattedDate = function() {
    if (this._date) {
      return LocalTime.relativeTimeAgo(this._date);
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


  var LocalTimePrototype = Object.create(parent.prototype);

  LocalTimePrototype.attributeChangedCallback = attributeChanged;

  LocalTimePrototype.getFormattedTitle = formattedTitle;

  LocalTimePrototype.createdCallback = function() {
    var value;
    if (value = this.getAttribute('datetime')) {
      this.attributeChangedCallback('datetime', null, value);
    }
    if (value = this.getAttribute('format')) {
      this.attributeChangedCallback('format', null, value);
    }
  };

  LocalTimePrototype.getFormattedDate = function() {
    if (this._date && this.hasAttribute('format')) {
      return LocalTime.strftime(this._date, this.getAttribute('format'));
    }
  };


  // Public: RelativeTimeElement constructor.
  //
  //   var time = new RelativeTimeElement()
  //   # => <time is="relative-time"></time>
  //
  window.RelativeTimeElement = document.registerElement('relative-time', {
    prototype: RelativeTimePrototype,
    extends: 'time'
  });


  // Public: LocalTimeElement constructor.
  //
  //   var time = new LocalTimeElement()
  //   # => <time is="local-time"></time>
  //
  window.LocalTimeElement = document.registerElement('local-time', {
    prototype: LocalTimePrototype,
    extends: 'time'
  });

})();
