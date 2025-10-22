import type { Duration } from './duration.js';
interface DurationFormatResolvedOptions {
    locale: string;
    style: 'long' | 'short' | 'narrow' | 'digital';
    years: 'long' | 'short' | 'narrow';
    yearsDisplay: 'always' | 'auto';
    months: 'long' | 'short' | 'narrow';
    monthsDisplay: 'always' | 'auto';
    weeks: 'long' | 'short' | 'narrow';
    weeksDisplay: 'always' | 'auto';
    days: 'long' | 'short' | 'narrow';
    daysDisplay: 'always' | 'auto';
    hours: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
    hoursDisplay: 'always' | 'auto';
    minutes: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
    minutesDisplay: 'always' | 'auto';
    seconds: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
    secondsDisplay: 'always' | 'auto';
    milliseconds: 'long' | 'short' | 'narrow' | 'numeric';
    millisecondsDisplay: 'always' | 'auto';
}
export type DurationFormatOptions = Partial<Omit<DurationFormatResolvedOptions, 'locale'>>;
interface DurationPart {
    type: 'integer' | 'literal' | 'element';
    value: string;
}
export default class DurationFormat {
    #private;
    constructor(locale: string, options?: DurationFormatOptions);
    resolvedOptions(): DurationFormatResolvedOptions;
    formatToParts(duration: Duration): DurationPart[];
    format(duration: Duration): string;
}
export {};
