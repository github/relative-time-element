declare class ExtendedTimeElement extends HTMLElement {
  readonly date: Date | undefined
  getFormattedTitle(): string | undefined
  getFormattedDate(): string | undefined
}

export class LocalTimeElement extends ExtendedTimeElement {
  getFormattedDate(): string | undefined
}

export class RelativeTimeElement extends ExtendedTimeElement {
  getFormattedDate(): string | undefined
}

export class TimeAgoElement extends ExtendedTimeElement {
  getFormattedDate(): string | undefined
}

export class TimeUntilElement extends ExtendedTimeElement {
  getFormattedDate(): string | undefined
}

declare global {
  interface Window {
    LocalTimeElement: typeof LocalTimeElement;
    RelativeTimeElement: typeof RelativeTimeElement;
    TimeAgoElement: typeof TimeAgoElement;
    TimeUntilElement: typeof TimeUntilElement;
  }
}
