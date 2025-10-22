import type { DurationFormatOptions } from './duration-format-ponyfill.js';
export declare const unitNames: readonly ["year", "month", "week", "day", "hour", "minute", "second", "millisecond"];
export type Unit = typeof unitNames[number];
export declare const isDuration: (str: string) => boolean;
type Sign = -1 | 0 | 1;
export declare class Duration {
    readonly years: number;
    readonly months: number;
    readonly weeks: number;
    readonly days: number;
    readonly hours: number;
    readonly minutes: number;
    readonly seconds: number;
    readonly milliseconds: number;
    readonly sign: Sign;
    readonly blank: boolean;
    constructor(years?: number, months?: number, weeks?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number);
    abs(): Duration;
    static from(durationLike: unknown): Duration;
    static compare(one: unknown, two: unknown): -1 | 0 | 1;
    toLocaleString(locale: string, opts: DurationFormatOptions): string;
}
export declare function applyDuration(date: Date | number, duration: Duration): Date;
export declare function elapsedTime(date: Date, precision?: Unit, now?: number): Duration;
interface RoundingOpts {
    relativeTo: Date | number;
}
export declare function roundToSingleUnit(duration: Duration, { relativeTo }?: Partial<RoundingOpts>): Duration;
export declare function getRelativeTimeUnit(duration: Duration, opts?: Partial<RoundingOpts>): [number, Intl.RelativeTimeFormatUnit];
export {};
