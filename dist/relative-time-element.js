var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _RelativeTimeElement_instances, _RelativeTimeElement_customTitle, _RelativeTimeElement_updating, _RelativeTimeElement_lang_get, _RelativeTimeElement_renderRoot, _RelativeTimeElement_getFormattedTitle, _RelativeTimeElement_resolveFormat, _RelativeTimeElement_getDurationFormat, _RelativeTimeElement_getRelativeFormat, _RelativeTimeElement_getDateTimeFormat, _RelativeTimeElement_isToday, _RelativeTimeElement_isCurrentYear, _RelativeTimeElement_getUserPreferredAbsoluteTimeFormat, _RelativeTimeElement_updateRenderRootContent, _RelativeTimeElement_shouldDisplayUserPreferredAbsoluteTime, _RelativeTimeElement_onRelativeTimeUpdated;
import { Duration, elapsedTime, getRelativeTimeUnit, isDuration, roundToSingleUnit, unitNames } from './duration.js';
const HTMLElement = globalThis.HTMLElement || null;
const emptyDuration = new Duration();
const microEmptyDuration = new Duration(0, 0, 0, 0, 0, 1);
export class RelativeTimeUpdatedEvent extends Event {
    constructor(oldText, newText, oldTitle, newTitle) {
        super('relative-time-updated', { bubbles: true, composed: true });
        this.oldText = oldText;
        this.newText = newText;
        this.oldTitle = oldTitle;
        this.newTitle = newTitle;
    }
}
function getUnitFactor(el) {
    if (!el.date)
        return Infinity;
    if (el.format === 'duration' || el.format === 'elapsed') {
        const precision = el.precision;
        if (precision === 'second') {
            return 1000;
        }
        else if (precision === 'minute') {
            return 60 * 1000;
        }
    }
    const ms = Math.abs(Date.now() - el.date.getTime());
    if (ms < 60 * 1000)
        return 1000;
    if (ms < 60 * 60 * 1000)
        return 60 * 1000;
    return 60 * 60 * 1000;
}
const dateObserver = new (class {
    constructor() {
        this.elements = new Set();
        this.time = Infinity;
        this.timer = -1;
    }
    observe(element) {
        if (this.elements.has(element))
            return;
        this.elements.add(element);
        const date = element.date;
        if (date && date.getTime()) {
            const ms = getUnitFactor(element);
            const time = Date.now() + ms;
            if (time < this.time) {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => this.update(), ms);
                this.time = time;
            }
        }
    }
    unobserve(element) {
        if (!this.elements.has(element))
            return;
        this.elements.delete(element);
    }
    update() {
        clearTimeout(this.timer);
        if (!this.elements.size)
            return;
        let nearestDistance = Infinity;
        for (const timeEl of this.elements) {
            nearestDistance = Math.min(nearestDistance, getUnitFactor(timeEl));
            timeEl.update();
        }
        this.time = Math.min(60 * 60 * 1000, nearestDistance);
        this.timer = setTimeout(() => this.update(), this.time);
        this.time += Date.now();
    }
})();
export class RelativeTimeElement extends HTMLElement {
    constructor() {
        super(...arguments);
        _RelativeTimeElement_instances.add(this);
        _RelativeTimeElement_customTitle.set(this, false);
        _RelativeTimeElement_updating.set(this, false);
        _RelativeTimeElement_renderRoot.set(this, this.shadowRoot ? this.shadowRoot : this.attachShadow ? this.attachShadow({ mode: 'open' }) : this);
        _RelativeTimeElement_onRelativeTimeUpdated.set(this, null);
    }
    static define(tag = 'relative-time', registry = customElements) {
        registry.define(tag, this);
        return this;
    }
    get timeZone() {
        var _a;
        const tz = ((_a = this.closest('[time-zone]')) === null || _a === void 0 ? void 0 : _a.getAttribute('time-zone')) ||
            this.ownerDocument.documentElement.getAttribute('time-zone');
        return tz || undefined;
    }
    static get observedAttributes() {
        return [
            'second',
            'minute',
            'hour',
            'weekday',
            'day',
            'month',
            'year',
            'time-zone-name',
            'prefix',
            'threshold',
            'tense',
            'precision',
            'format',
            'format-style',
            'no-title',
            'datetime',
            'lang',
            'title',
            'aria-hidden',
            'time-zone',
        ];
    }
    get onRelativeTimeUpdated() {
        return __classPrivateFieldGet(this, _RelativeTimeElement_onRelativeTimeUpdated, "f");
    }
    set onRelativeTimeUpdated(listener) {
        if (__classPrivateFieldGet(this, _RelativeTimeElement_onRelativeTimeUpdated, "f")) {
            this.removeEventListener('relative-time-updated', __classPrivateFieldGet(this, _RelativeTimeElement_onRelativeTimeUpdated, "f"));
        }
        __classPrivateFieldSet(this, _RelativeTimeElement_onRelativeTimeUpdated, typeof listener === 'object' || typeof listener === 'function' ? listener : null, "f");
        if (typeof listener === 'function') {
            this.addEventListener('relative-time-updated', listener);
        }
    }
    get second() {
        const second = this.getAttribute('second');
        if (second === 'numeric' || second === '2-digit')
            return second;
    }
    set second(value) {
        this.setAttribute('second', value || '');
    }
    get minute() {
        const minute = this.getAttribute('minute');
        if (minute === 'numeric' || minute === '2-digit')
            return minute;
    }
    set minute(value) {
        this.setAttribute('minute', value || '');
    }
    get hour() {
        const hour = this.getAttribute('hour');
        if (hour === 'numeric' || hour === '2-digit')
            return hour;
    }
    set hour(value) {
        this.setAttribute('hour', value || '');
    }
    get weekday() {
        const weekday = this.getAttribute('weekday');
        if (weekday === 'long' || weekday === 'short' || weekday === 'narrow') {
            return weekday;
        }
        if (this.format === 'datetime' && weekday !== '')
            return this.formatStyle;
    }
    set weekday(value) {
        this.setAttribute('weekday', value || '');
    }
    get day() {
        var _a;
        const day = (_a = this.getAttribute('day')) !== null && _a !== void 0 ? _a : 'numeric';
        if (day === 'numeric' || day === '2-digit')
            return day;
    }
    set day(value) {
        this.setAttribute('day', value || '');
    }
    get month() {
        const format = this.format;
        let month = this.getAttribute('month');
        if (month === '')
            return;
        month !== null && month !== void 0 ? month : (month = format === 'datetime' ? this.formatStyle : 'short');
        if (month === 'numeric' || month === '2-digit' || month === 'short' || month === 'long' || month === 'narrow') {
            return month;
        }
    }
    set month(value) {
        this.setAttribute('month', value || '');
    }
    get year() {
        var _a;
        const year = this.getAttribute('year');
        if (year === 'numeric' || year === '2-digit')
            return year;
        if (!this.hasAttribute('year') && new Date().getUTCFullYear() !== ((_a = this.date) === null || _a === void 0 ? void 0 : _a.getUTCFullYear())) {
            return 'numeric';
        }
    }
    set year(value) {
        this.setAttribute('year', value || '');
    }
    get timeZoneName() {
        const name = this.getAttribute('time-zone-name');
        if (name === 'long' ||
            name === 'short' ||
            name === 'shortOffset' ||
            name === 'longOffset' ||
            name === 'shortGeneric' ||
            name === 'longGeneric') {
            return name;
        }
    }
    set timeZoneName(value) {
        this.setAttribute('time-zone-name', value || '');
    }
    get prefix() {
        var _a;
        return (_a = this.getAttribute('prefix')) !== null && _a !== void 0 ? _a : (this.format === 'datetime' ? '' : 'on');
    }
    set prefix(value) {
        this.setAttribute('prefix', value);
    }
    get threshold() {
        const threshold = this.getAttribute('threshold');
        return threshold && isDuration(threshold) ? threshold : 'P30D';
    }
    set threshold(value) {
        this.setAttribute('threshold', value);
    }
    get tense() {
        const tense = this.getAttribute('tense');
        if (tense === 'past')
            return 'past';
        if (tense === 'future')
            return 'future';
        return 'auto';
    }
    set tense(value) {
        this.setAttribute('tense', value);
    }
    get precision() {
        const precision = this.getAttribute('precision');
        if (unitNames.includes(precision))
            return precision;
        if (this.format === 'micro')
            return 'minute';
        return 'second';
    }
    set precision(value) {
        this.setAttribute('precision', value);
    }
    get format() {
        const format = this.getAttribute('format');
        if (format === 'datetime')
            return 'datetime';
        if (format === 'relative')
            return 'relative';
        if (format === 'duration')
            return 'duration';
        if (format === 'micro')
            return 'micro';
        if (format === 'elapsed')
            return 'elapsed';
        return 'auto';
    }
    set format(value) {
        this.setAttribute('format', value);
    }
    get formatStyle() {
        const formatStyle = this.getAttribute('format-style');
        if (formatStyle === 'long')
            return 'long';
        if (formatStyle === 'short')
            return 'short';
        if (formatStyle === 'narrow')
            return 'narrow';
        const format = this.format;
        if (format === 'elapsed' || format === 'micro')
            return 'narrow';
        if (format === 'datetime')
            return 'short';
        return 'long';
    }
    set formatStyle(value) {
        this.setAttribute('format-style', value);
    }
    get noTitle() {
        return this.hasAttribute('no-title');
    }
    set noTitle(value) {
        this.toggleAttribute('no-title', value);
    }
    get datetime() {
        return this.getAttribute('datetime') || '';
    }
    set datetime(value) {
        this.setAttribute('datetime', value);
    }
    get date() {
        const parsed = Date.parse(this.datetime);
        return Number.isNaN(parsed) ? null : new Date(parsed);
    }
    set date(value) {
        this.datetime = (value === null || value === void 0 ? void 0 : value.toISOString()) || '';
    }
    connectedCallback() {
        this.update();
    }
    disconnectedCallback() {
        dateObserver.unobserve(this);
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (attrName === 'title') {
            __classPrivateFieldSet(this, _RelativeTimeElement_customTitle, newValue !== null && (this.date && __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getFormattedTitle).call(this, this.date)) !== newValue, "f");
        }
        if (!__classPrivateFieldGet(this, _RelativeTimeElement_updating, "f") && !(attrName === 'title' && __classPrivateFieldGet(this, _RelativeTimeElement_customTitle, "f"))) {
            __classPrivateFieldSet(this, _RelativeTimeElement_updating, (async () => {
                await Promise.resolve();
                this.update();
                __classPrivateFieldSet(this, _RelativeTimeElement_updating, false, "f");
            })(), "f");
        }
    }
    update() {
        const oldText = __classPrivateFieldGet(this, _RelativeTimeElement_renderRoot, "f").textContent || this.textContent || '';
        const oldTitle = this.getAttribute('title') || '';
        let newTitle = oldTitle;
        const date = this.date;
        if (typeof Intl === 'undefined' || !Intl.DateTimeFormat || !date) {
            __classPrivateFieldGet(this, _RelativeTimeElement_renderRoot, "f").textContent = oldText;
            return;
        }
        const now = Date.now();
        if (!__classPrivateFieldGet(this, _RelativeTimeElement_customTitle, "f")) {
            newTitle = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getFormattedTitle).call(this, date) || '';
            if (newTitle && !this.noTitle)
                this.setAttribute('title', newTitle);
        }
        const duration = elapsedTime(date, this.precision, now);
        const format = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_resolveFormat).call(this, duration);
        let newText = oldText;
        const displayUserPreferredAbsoluteTime = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_shouldDisplayUserPreferredAbsoluteTime).call(this, format);
        if (displayUserPreferredAbsoluteTime) {
            newText = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getUserPreferredAbsoluteTimeFormat).call(this, date);
        }
        else {
            if (format === 'duration') {
                newText = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getDurationFormat).call(this, duration);
            }
            else if (format === 'relative') {
                newText = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getRelativeFormat).call(this, duration);
            }
            else {
                newText = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_getDateTimeFormat).call(this, date);
            }
        }
        if (newText) {
            __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_updateRenderRootContent).call(this, newText);
        }
        else if (this.shadowRoot === __classPrivateFieldGet(this, _RelativeTimeElement_renderRoot, "f") && this.textContent) {
            __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_updateRenderRootContent).call(this, this.textContent);
        }
        if (newText !== oldText || newTitle !== oldTitle) {
            this.dispatchEvent(new RelativeTimeUpdatedEvent(oldText, newText, oldTitle, newTitle));
        }
        const shouldObserve = format === 'relative' ||
            format === 'duration' ||
            (displayUserPreferredAbsoluteTime && (__classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_isToday).call(this, date) || __classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_isCurrentYear).call(this, date)));
        if (shouldObserve) {
            dateObserver.observe(this);
        }
        else {
            dateObserver.unobserve(this);
        }
    }
}
_RelativeTimeElement_customTitle = new WeakMap(), _RelativeTimeElement_updating = new WeakMap(), _RelativeTimeElement_renderRoot = new WeakMap(), _RelativeTimeElement_onRelativeTimeUpdated = new WeakMap(), _RelativeTimeElement_instances = new WeakSet(), _RelativeTimeElement_lang_get = function _RelativeTimeElement_lang_get() {
    var _a;
    const lang = ((_a = this.closest('[lang]')) === null || _a === void 0 ? void 0 : _a.getAttribute('lang')) || this.ownerDocument.documentElement.getAttribute('lang');
    try {
        return new Intl.Locale(lang !== null && lang !== void 0 ? lang : '').toString();
    }
    catch (_b) {
        return 'default';
    }
}, _RelativeTimeElement_getFormattedTitle = function _RelativeTimeElement_getFormattedTitle(date) {
    return new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: this.timeZone,
    }).format(date);
}, _RelativeTimeElement_resolveFormat = function _RelativeTimeElement_resolveFormat(duration) {
    const format = this.format;
    if (format === 'datetime')
        return 'datetime';
    if (format === 'duration')
        return 'duration';
    if (format === 'elapsed')
        return 'duration';
    if (format === 'micro')
        return 'duration';
    if ((format === 'auto' || format === 'relative') && typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        const tense = this.tense;
        if (tense === 'past' || tense === 'future')
            return 'relative';
        if (Duration.compare(duration, this.threshold) === 1)
            return 'relative';
    }
    return 'datetime';
}, _RelativeTimeElement_getDurationFormat = function _RelativeTimeElement_getDurationFormat(duration) {
    const locale = __classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get);
    const format = this.format;
    const style = this.formatStyle;
    const tense = this.tense;
    let empty = emptyDuration;
    if (format === 'micro') {
        duration = roundToSingleUnit(duration);
        empty = microEmptyDuration;
        if (duration.months === 0 &&
            ((this.tense === 'past' && duration.sign !== -1) || (this.tense === 'future' && duration.sign !== 1))) {
            duration = microEmptyDuration;
        }
    }
    else if ((tense === 'past' && duration.sign !== -1) || (tense === 'future' && duration.sign !== 1)) {
        duration = empty;
    }
    const display = `${this.precision}sDisplay`;
    if (duration.blank) {
        return empty.toLocaleString(locale, { style, [display]: 'always' });
    }
    return duration.abs().toLocaleString(locale, { style });
}, _RelativeTimeElement_getRelativeFormat = function _RelativeTimeElement_getRelativeFormat(duration) {
    const relativeFormat = new Intl.RelativeTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), {
        numeric: 'auto',
        style: this.formatStyle,
    });
    const tense = this.tense;
    if (tense === 'future' && duration.sign !== 1)
        duration = emptyDuration;
    if (tense === 'past' && duration.sign !== -1)
        duration = emptyDuration;
    const [int, unit] = getRelativeTimeUnit(duration);
    if (unit === 'second' && int < 10) {
        return relativeFormat.format(0, this.precision === 'millisecond' ? 'second' : this.precision);
    }
    return relativeFormat.format(int, unit);
}, _RelativeTimeElement_getDateTimeFormat = function _RelativeTimeElement_getDateTimeFormat(date) {
    const formatter = new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), {
        second: this.second,
        minute: this.minute,
        hour: this.hour,
        weekday: this.weekday,
        day: this.day,
        month: this.month,
        year: this.year,
        timeZoneName: this.timeZoneName,
        timeZone: this.timeZone,
    });
    return `${this.prefix} ${formatter.format(date)}`.trim();
}, _RelativeTimeElement_isToday = function _RelativeTimeElement_isToday(date) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), {
        timeZone: this.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(now) === formatter.format(date);
}, _RelativeTimeElement_isCurrentYear = function _RelativeTimeElement_isCurrentYear(date) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), {
        timeZone: this.timeZone,
        year: 'numeric',
    });
    return formatter.format(now) === formatter.format(date);
}, _RelativeTimeElement_getUserPreferredAbsoluteTimeFormat = function _RelativeTimeElement_getUserPreferredAbsoluteTimeFormat(date) {
    const timeOnlyOptions = {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
        timeZone: this.timeZone,
    };
    if (__classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_isToday).call(this, date)) {
        const relativeFormatter = new Intl.RelativeTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), { numeric: 'auto' });
        let todayText = relativeFormatter.format(0, 'day');
        todayText = todayText.charAt(0).toLocaleUpperCase(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get)) + todayText.slice(1);
        const timeOnly = new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), timeOnlyOptions).format(date);
        return `${todayText} ${timeOnly}`;
    }
    const timeAndDateOptions = Object.assign(Object.assign({}, timeOnlyOptions), { day: 'numeric', month: 'short' });
    if (__classPrivateFieldGet(this, _RelativeTimeElement_instances, "m", _RelativeTimeElement_isCurrentYear).call(this, date)) {
        return new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), timeAndDateOptions).format(date);
    }
    return new Intl.DateTimeFormat(__classPrivateFieldGet(this, _RelativeTimeElement_instances, "a", _RelativeTimeElement_lang_get), Object.assign(Object.assign({}, timeAndDateOptions), { year: 'numeric' })).format(date);
}, _RelativeTimeElement_updateRenderRootContent = function _RelativeTimeElement_updateRenderRootContent(content) {
    if (this.hasAttribute('aria-hidden') && this.getAttribute('aria-hidden') === 'true') {
        const span = document.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        span.textContent = content;
        __classPrivateFieldGet(this, _RelativeTimeElement_renderRoot, "f").replaceChildren(span);
    }
    else {
        __classPrivateFieldGet(this, _RelativeTimeElement_renderRoot, "f").textContent = content;
    }
}, _RelativeTimeElement_shouldDisplayUserPreferredAbsoluteTime = function _RelativeTimeElement_shouldDisplayUserPreferredAbsoluteTime(format) {
    var _a;
    if (format === 'duration')
        return false;
    return (this.ownerDocument.documentElement.getAttribute('data-prefers-absolute-time') === 'true' ||
        ((_a = this.ownerDocument.body) === null || _a === void 0 ? void 0 : _a.getAttribute('data-prefers-absolute-time')) === 'true');
};
export default RelativeTimeElement;
