var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DurationFormat_options;
class ListFormatPonyFill {
    formatToParts(members) {
        const parts = [];
        for (const value of members) {
            parts.push({ type: 'element', value });
            parts.push({ type: 'literal', value: ', ' });
        }
        return parts.slice(0, -1);
    }
}
const ListFormat = (typeof Intl !== 'undefined' && Intl.ListFormat) || ListFormatPonyFill;
const partsTable = [
    ['years', 'year'],
    ['months', 'month'],
    ['weeks', 'week'],
    ['days', 'day'],
    ['hours', 'hour'],
    ['minutes', 'minute'],
    ['seconds', 'second'],
    ['milliseconds', 'millisecond'],
];
const twoDigitFormatOptions = { minimumIntegerDigits: 2 };
export default class DurationFormat {
    constructor(locale, options = {}) {
        _DurationFormat_options.set(this, void 0);
        let style = String(options.style || 'short');
        if (style !== 'long' && style !== 'short' && style !== 'narrow' && style !== 'digital')
            style = 'short';
        let prevStyle = style === 'digital' ? 'numeric' : style;
        const hours = options.hours || prevStyle;
        prevStyle = hours === '2-digit' ? 'numeric' : hours;
        const minutes = options.minutes || prevStyle;
        prevStyle = minutes === '2-digit' ? 'numeric' : minutes;
        const seconds = options.seconds || prevStyle;
        prevStyle = seconds === '2-digit' ? 'numeric' : seconds;
        const milliseconds = options.milliseconds || prevStyle;
        __classPrivateFieldSet(this, _DurationFormat_options, {
            locale,
            style,
            years: options.years || style === 'digital' ? 'short' : style,
            yearsDisplay: options.yearsDisplay === 'always' ? 'always' : 'auto',
            months: options.months || style === 'digital' ? 'short' : style,
            monthsDisplay: options.monthsDisplay === 'always' ? 'always' : 'auto',
            weeks: options.weeks || style === 'digital' ? 'short' : style,
            weeksDisplay: options.weeksDisplay === 'always' ? 'always' : 'auto',
            days: options.days || style === 'digital' ? 'short' : style,
            daysDisplay: options.daysDisplay === 'always' ? 'always' : 'auto',
            hours,
            hoursDisplay: options.hoursDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
            minutes,
            minutesDisplay: options.minutesDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
            seconds,
            secondsDisplay: options.secondsDisplay === 'always' ? 'always' : style === 'digital' ? 'always' : 'auto',
            milliseconds,
            millisecondsDisplay: options.millisecondsDisplay === 'always' ? 'always' : 'auto',
        }, "f");
    }
    resolvedOptions() {
        return __classPrivateFieldGet(this, _DurationFormat_options, "f");
    }
    formatToParts(duration) {
        const list = [];
        const options = __classPrivateFieldGet(this, _DurationFormat_options, "f");
        const style = options.style;
        const locale = options.locale;
        for (const [unit, nfUnit] of partsTable) {
            const value = duration[unit];
            if (options[`${unit}Display`] === 'auto' && !value)
                continue;
            const unitStyle = options[unit];
            const nfOpts = unitStyle === '2-digit'
                ? twoDigitFormatOptions
                : unitStyle === 'numeric'
                    ? {}
                    : { style: 'unit', unit: nfUnit, unitDisplay: unitStyle };
            let formattedValue = new Intl.NumberFormat(locale, nfOpts).format(value);
            if (unit === 'months' && (unitStyle === 'narrow' || (style === 'narrow' && formattedValue.endsWith('m')))) {
                formattedValue = formattedValue.replace(/(\d+)m$/, '$1mo');
            }
            list.push(formattedValue);
        }
        return new ListFormat(locale, {
            type: 'unit',
            style: style === 'digital' ? 'short' : style,
        }).formatToParts(list);
    }
    format(duration) {
        return this.formatToParts(duration)
            .map(p => p.value)
            .join('');
    }
}
_DurationFormat_options = new WeakMap();
