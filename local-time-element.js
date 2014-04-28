(function() {
  'use strict';
  /* global moment */

  var ldml = {
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

  function strftime(date, format) {
    var momentFormat = format;
    var key, value;
    for (key in ldml) {
      value = ldml[key];
      momentFormat = momentFormat.replace('%' + key, value);
    }
    return moment(date).format(momentFormat);
  }

  // Internal: Format to from range as a relative time.
  //
  // to - Date
  // from - Date
  //
  // Returns String.
  function formatFrom(to, from) {
    var text = moment(to).from(moment(from));
    if (text === 'a few seconds ago') {
      return 'just now';
    } else if (text === 'in a few seconds') {
      return 'just now';
    } else {
      return text;
    }
  }

  // Internal: Array tracking all elements attached to the document that need
  // to be updated every minute.
  var nowElements = [];

  // Internal: Timer ID for `updateNowElements` interval.
  var updateNowElementsId;

  // Internal: Install a timer to refresh all attached local-time elements every
  // minute.
  function updateNowElements() {
    var time, i, len;
    for (i = 0, len = nowElements.length; i < len; i++) {
      time = nowElements[i];
      time.textContent = time.getFormattedDate();
    }
  }

  // Internal: Add/remove local-time element to now elements live element list.
  //
  // time - LocalTimeElement
  //
  // Returns nothing.
  function checkNowElement(time) {
    if (time._attached && time._date && time._relativeDate) {
      nowElements.push(time);
    } else {
      var i = nowElements.indexOf(time);
      if (i !== -1) {
        nowElements.splice(i, 1);
      }
    }

    if (nowElements.length) {
      if (!updateNowElementsId) {
        updateNowElements();
        updateNowElementsId = setInterval(updateNowElements, 60 * 1000);
      }
    } else {
      if (updateNowElementsId) {
        clearInterval(updateNowElementsId);
        updateNowElementsId = null;
      }
    }
  }


  // Public: Exposed as LocalTimeElement.prototype.
  var LocalTimePrototype = Object.create(HTMLElement.prototype);

  // Internal: Initialize state.
  //
  // Returns nothing.
  LocalTimePrototype.createdCallback = function() {
    var value;
    if (value = this.getAttribute('datetime')) {
      this.attributeChangedCallback('datetime', null, value);
    }
    if (value = this.getAttribute('format')) {
      this.attributeChangedCallback('format', null, value);
    }
  };

  // Internal: Update internal state when any attribute changes.
  //
  // Returns nothing.
  LocalTimePrototype.attributeChangedCallback = function(attrName, oldValue, newValue) {
    if (attrName === 'datetime') {
      this._date = moment(Date.parse(newValue));
    }
    if (attrName === 'format') {
      if (newValue === 'relative') {
        this._relativeDate = true;
      } else {
        this._relativeDate = false;
      }
      checkNowElement(this);
    }
    var title;
    if (title = this.getFormattedTitle()) {
      this.setAttribute('title', title);
    }

    var text;
    if (text = this.getFormattedDate()) {
      this.textContent = text;
    }
  };

  // Internal: Run attached to document hooks.
  //
  // Track element for refreshing every minute.
  //
  // Returns nothing.
  LocalTimePrototype.attachedCallback = function() {
    this._attached = true;
    checkNowElement(this);
  };

  // Internal: Run detached from document hooks.
  //
  // Stops tracking element for time refreshes every minute.
  //
  // Returns nothing.
  LocalTimePrototype.detachedCallback = function() {
    this._attached = false;
    checkNowElement(this);
  };

  // Public: Get formatted datetime.
  //
  // Returns String or null.
  LocalTimePrototype.getFormattedDate = function() {
    if (this._date && this.hasAttribute('format')) {
      if (this.getAttribute('format') === 'relative') {
        return formatFrom(this._date, new Date());
      } else {
        return strftime(this._date, this.getAttribute('format'));
      }
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

  // Public: LocalTimeElement constructor.
  //
  //   time = new LocalTimeElement
  //   # => <local-time></local-time>
  //
  window.LocalTimeElement = document.registerElement('local-time', {
    prototype: LocalTimePrototype
  });

})();
