// LocalTime Element
//
// Formats date as a localized string or as relative text that auto updates in
// the user's browser.
//
// ### Attributes
//
// datetime     - MUST be a ISO8601 String
// format       - A strftime token String
// title-format - A strftime token String
// from         - A String "now" or an ISO8601 string
//
// ### Examples
//
// ``` html
// <local-time datetime="<%= created_at.iso8601 %>" format="%m/%d/%y">
//   <%= created_at.to_date %>
// </local-time>
// ```
//
// ``` html
// <local-time datetime="<%= created_at.iso8601 %>" from="now">
//   <%= created_at.to_date %>
// </local-time>
// ```
//
(function() {
  'use strict';

  var LocalTimePrototype, attachedInstances, formatFrom, ldml, parseISO8601, strftime, updateFromNowLocalTimeElements;

  ldml = {
    a: 'ddd',
    A: 'dddd',
    b: 'MMM',
    B: 'MMMM',
    d: 'DD',
    H: 'HH',
    I: 'hh',
    j: 'DDDD',
    m: 'MM',
    M: 'mm',
    p: 'A',
    S: 'ss',
    z: 'ZZ',
    w: 'd',
    y: 'YY',
    Y: 'YYYY',
    '%': '%'
  };

  strftime = function(date, format) {
    var key, momentFormat, value;
    momentFormat = format;
    for (key in ldml) {
      value = ldml[key];
      momentFormat = momentFormat.replace('%' + key, value);
    }
    return moment(date).format(momentFormat);
  };

  // Internal: Parse ISO8601 String.
  //
  // str - String in ISO8601 format.
  //
  // Returns Moment or null if input is invalid.
  parseISO8601 = function(str) {
    var date;
    date = moment(str, 'YYYY-MM-DDTHH:mm:ssZ');
    if (date.isValid()) {
      return date.toDate();
    } else {
      return null;
    }
  };

  // Internal: Format to from range as a relative time.
  //
  // to - Date
  // from - Date (default: Date.now())
  //
  // Returns String.
  formatFrom = function(to, from) {
    var text;
    if (from == null) {
      from = Date.now();
    }
    text = moment(to).from(moment(from));
    if (text === 'a few seconds ago') {
      return 'just now';
    } else if (text === 'in a few seconds') {
      return 'just now';
    } else {
      return text;
    }
  };

  // Internal: Array tracking all elements attached to the document.
  attachedInstances = [];

  // Public: Exposed as LocalTimeElement.prototype.
  LocalTimePrototype = Object.create(HTMLElement.prototype);

  // Internal: Initialize state.
  //
  // Returns nothing.
  LocalTimePrototype.createdCallback = function() {
    var value;
    if (value = this.getAttribute('datetime')) {
      this.attributeChangedCallback('datetime', null, value);
    }
    if (value = this.getAttribute('from')) {
      this.attributeChangedCallback('from', null, value);
    }
  };

  // Internal: Update internal state when any attribute changes.
  //
  // Returns nothing.
  LocalTimePrototype.attributeChangedCallback = function(attrName, oldValue, newValue) {
    var text, title;
    if (attrName === 'datetime') {
      this._date = parseISO8601(newValue);
    }
    if (attrName === 'from') {
      if (newValue === 'now') {
        this._fromNowDate = true;
        this._fromDate = null;
      } else {
        this._fromNowDate = false;
        this._fromDate = parseISO8601(newValue);
      }
    }
    if (title = this.getFormattedTitle()) {
      this.setAttribute('title', title);
    }
    if (text = this.getFormattedDate() || this.getFormattedFromDate()) {
      this.textContent = text;
    }
  };

  // Internal: Run attached to document hooks.
  //
  // Track element for refreshing every minute.
  //
  // Returns nothing.
  LocalTimePrototype.attachedCallback = function() {
    attachedInstances.push(this);
  };

  // Internal: Run detached from document hooks.
  //
  // Stops tracking element for time refreshes every minute.
  //
  // Returns nothing.
  LocalTimePrototype.detachedCallback = function() {
    var i;
    i = attachedInstances.indexOf(this);
    if (i !== -1) {
      attachedInstances.splice(i, 1);
    }
  };

  // Public: Get formatted datetime.
  //
  // Returns String or null.
  LocalTimePrototype.getFormattedDate = function() {
    if (this._date && this.hasAttribute('format')) {
      return strftime(this._date, this.getAttribute('format'));
    }
  };

  // Public: Get formatted from.
  //
  // Returns String or null.
  LocalTimePrototype.getFormattedFromDate = function() {
    if (this._date && this.hasAttribute('from')) {
      return formatFrom(this._date, this._fromDate);
    }
  };

  // Public: Get formatted title string
  //
  // Returns String or null.
  LocalTimePrototype.getFormattedTitle = function() {
    if (this._date && this.hasAttribute('title-format')) {
      return strftime(this._date, this.getAttribute('title-format'));
    }
  };

  // Internal: Install a timer to refresh all attached local-time elements every
  // minute.
  updateFromNowLocalTimeElements = function() {
    var time, _i, _len;
    for (_i = 0, _len = attachedInstances.length; _i < _len; _i++) {
      time = attachedInstances[_i];
      if (time._date && time._fromNowDate) {
        time.textContent = time.getFormattedFromDate();
      }
    }
  };

  setInterval(updateFromNowLocalTimeElements, 60000);

  // Public: LocalTimeElement constructor.
  //
  //   time = new LocalTimeElement
  //   # => <local-time></local-time>
  //
  window.LocalTimeElement = document.registerElement('local-time', {
    prototype: LocalTimePrototype
  });

}).call(this);
