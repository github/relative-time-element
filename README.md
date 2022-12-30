# &lt;relative-time&gt; element

Formats a timestamp as a localized string or as relative text that auto-updates in the user's browser.

This allows the server to cache HTML fragments containing dates and lets the browser choose how to localize the displayed time according to the user's preferences. For example, the server may have cached the following generated markup:

```html
<relative-time datetime="2014-04-01T16:30:00-08:00">
  April 1, 2014 4:30pm
</relative-time>
```

Every visitor is served the same markup from the server's cache. When it reaches the browser, the custom `relative-time` JavaScript localizes the element's text into the local timezone and formatting.

```html
<relative-time datetime="2014-04-01T16:30:00-08:00">
  1 Apr 2014 21:30
</relative-time>
```

Dates are displayed before months, and a 24-hour clock is used, according to the user's browser settings.

If the browser's JavaScript is disabled, the default text served in the cached markup is still displayed.

## Installation

Available on [npm](https://www.npmjs.com/) as [**@github/relative-time-element**](https://www.npmjs.com/package/@github/relative-time-element).

```
$ npm install @github/relative-time-element
```

This element uses the `Intl.DateTimeFormat` & `Intl.RelativeTimeFormat` APIs, which are supported by all modern JS engines. If you need to support an older browser, you may need to introduce a polyfill for `Intl.DateTimeFormat` & `Intl.RelativeTimeFormat`.

## Usage

Add a `<relative-time>` element to your markup. Provide a default formatted date as the element's text content (e.g. April 1, 2014). It also MUST have a `datetime` attribute set to an ISO 8601 formatted timestamp.

```html
<relative-time datetime="2014-04-01T16:30:00-08:00">
  April 1, 2014
</relative-time>
```

Depending on how far in the future this is being viewed, the element's text will be replaced with one of the following formats:

- 6 years from now
- 20 days from now
- 4 hours from now
- 7 minutes from now
- just now
- 30 seconds ago
- a minute ago
- 30 minutes ago
- an hour ago
- 20 hours ago
- a day ago
- 20 days ago
- on Apr 1, 2014

So, a relative date phrase is used for up to a month and then the actual date is shown.

#### Attributes

| Property Name  | Attribute Name   | Possible Values                                                                             | Default Value                    |
|:---------------|:-----------------|:--------------------------------------------------------------------------------------------|:---------------------------------|
| `datetime`     | `datetime`       | `string`                                                                                    | -                                |
| `format`       | `format`         | `'datetime'\|'relative'\|'duration'`                                                        | `'auto'`                           |
| `date`         | -                | `Date \| null`                                                                              | -                                |
| `tense`        | `tense`          | `'auto'\|'past'\|'future'`                                                                  | `'auto'`                         |
| `precision`    | `precision`      | `'year'\|'month'\|'day'\|'hour'\|'minute'\|'second'`                                        | `'second'`                       |
| `threshold`    | `threshold`      | `string`                                                                                    | `'P30D'`                         |
| `prefix`       | `prefix`         | `string`                                                                                    | `'on'`                           |
| `formatStyle`  | `format-style`   | `'long'\|'short'\|'narrow'`                                                                 | <sup>*</sup>                     |
| `second`       | `second`         | `'numeric'\|'2-digit'\|undefined`                                                           | `undefined`                      |
| `minute`       | `minute`         | `'numeric'\|'2-digit'\|undefined`                                                           | `undefined`                      |
| `hour`         | `hour`           | `'numeric'\|'2-digit'\|undefined`                                                           | `undefined`                      |
| `weekday`      | `weekday`        | `'short'\|'long'\|'narrow'\|undefined`                                                      | <sup>**</sup>                    |
| `day`          | `day`            | `'numeric'\|'2-digit'\|undefined`                                                           | `'numeric'`                      |
| `month`        | `month`          | `'numeric'\|'2-digit'\|'short'\|'long'\|'narrow'\|undefined`                                | <sup>***</sup>                   |
| `year`         | `year`           | `'numeric'\|'2-digit'\|undefined`                                                           | <sup>****</sup>                  |
| `timeZoneName` | `time-zone-name` | `'long'\|'short'\|'shortOffset'\|'longOffset'` `\|'shortGeneric'\|'longGeneric'\|undefined` | `undefined`                      |

<sup>*</sup>: If unspecified, `formatStyle` will return `'narrow'` if `format` is `'elapsed'` or `'micro'`, `'short'` if the format is `'relative'` or `'datetime'`, otherwise it will be `'long'`.

<sup>**</sup>: If unspecified, `month` will return the same value as `formatStyle` whenever `format` is `'datetime'`, otherwise it wil be `'short'`.

<sup>***</sup>: If unspecified, `weekday` will return the same value as `formatStyle` whenever `format` is `'datetime'`, otherwise it will be `undefined`.

<sup>****</sup>: If unspecified, `year` will return `'numeric'` if `datetime` represents the same year as the current year. It will return `undefined` if unspecified and if `datetime` represents a different year to the current year.

##### datetime (`string`)

This is the datetime that the element is meant to represent. This must be a valid [ISO8601 DateTime](https://en.wikipedia.org/wiki/ISO_8601). It is also possible to use the `date` property on the element to set the date. `el.date` expects a `Date` object, while `el.datetime` expects a string. Setting one will override the other.

```html
<relative-time datetime="2014-04-01T16:30:00-08:00" tense="past">
  April 1, 2038 <!-- Will display "now" until April 1 2038 at 16:30:01! -->
</relative-time>
<script>
  const el = document.querySelector('relative-time')
  console.assert(el.date.toISOString() === el.datetime)
  el.date = new Date()
  console.assert(el.datetime !== "2014-04-01T16:30:00-08:00")
</script>
```

##### format (`'datetime'|'relative'|'duration'|'auto'|'micro'|'elapsed'`)

Format can be either `'datetime'`, `'relative'`, or `'duration'`. It can also be one of several deprecated formats of `'auto'`, `'micro'`, or `'elapsed'`.

The default format is `auto`, which is an alias for `relative`. In the next major version this will be `relative`.

###### `format=datetime`

The `datetime` format will display a localised datetime, based on the other properties of the element. It uses `Intl.DateTimeFormat` to display the `datetime` in a localised format.

Unless specified, it will consider `weekday` to be `'long'`, `month` to be `'long'`, and `'year'` to be `numeric` if the `datetime` is the same as the given year. Overriding `formatStyle` will change both `weekday` and `month` default values. Examples of this format with the default options and an `en` locale:

 - `Wed, 26 Aug 2021` 
 - `Sat, 31 Dec` (assuming the `datetime` is same year as the current year)

###### `format=relative`

The default `relative` format will display dates relative to the current time (unless they are past the `threshold` value - see below). The values are rounded to display a single unit, for example if the time between the given `datetime` and the current wall clock time exceeds a day, then the format will _only_ ouput in days, and will not display hours, minutes or seconds. Some examples of this format with the default options and an `en` locale:

 - `in 20 days`
 - `20 days ago`
 - `in 1 minute`
 - `on 31 Aug` (assuming the current date is the same year as the current year, and is more than 30 days away from 31 Aug)
 - `on 26 Aug 2021` (assuming the current date is more than 30 days away from 26 Aug 2021)

###### `format=duration`

The `duration` format will display the time remaining (or elapsed time) from the given datetime, counting down the number of years, months, weeks, days, hours, minutes, and seconds. Any value that is `0` will be omitted from the display by default. Examples of this format with the default options and an `en` locale:

- `4 hours, 2 minutes, 30 seconds`
- `4 hours`
- `8 days, 30 minutes, 1 second`

###### Deprecated Formats

###### `format=elapsed`

This is similar to the `format=duration`, except the `formatStyle` defaults to `narrow`. Code that  uses `format=elapsed` should migrate to `format=duration formatStyle=narrow`, as it will be removed in a later version.

###### `format=auto`

This is identical to `format=relative`. Code that uses `format=auto` should migrae to `format=relative` as this will be the new default in a later version.

###### `format=micro`

The `micro` format which will display relative dates (within the threshold) in a more compact format. Similar to `relative`, the `micro` format rounds values to the nearest largest value. Additionally, `micro` format will not round _lower_ than 1 minute, as such a `datetime` which is less than a minute from the current wall clock time will display `'1m'`.

Code that uses `format=micro` should consider migrating to `format=relative` (perhaps with `formatStyle=narrow`), as `format=micro` can be difficult for users to understand, and can cause issues with assistive technologies. For example some screen readers (such as VoiceOver for mac) will read out `1m` as `1 meter`.

###### Cheatsheet

| `format=datetime` | `format=relative` | `format=duration`                                | `format=micro`    | `format=elapsed` |
|:-----------------:|:-----------------:|:------------------------------------------------:|:-----------------:|:----------------:|
| Wed 26 May 2024   |  in 2 years       | 2 years, 10 days, 3 hours, 20 minutes, 8 seconds | 2y                | 2y 10d 3h 20m 8s |
| Wed 26 Aug 2021   |  2 years ago      | 2 years, 10 days, 3 hours, 8 seconds             | 2y                | 2y 10d 3h 8s    |
| Jan 15 2023       |  in 30 days       | 30 days, 4 hours, 20 minutes, 8 seconds          | 30d               | 30d 4h 20m 8s    |
| Dec 15 2022       |  21 minutes ago   | 21 minutes, 30 seconds                           | 21m               | 21m 30s          |
| Dec 15 2022       |  37 seconds ago   | 37 seconds                                       | 1m                | 37s              |

##### tense (`'auto'|'past'|'future'`, default: `auto`)

If `format` is `'datetime'` then this value will be ignored.

Tense can be used to prevent `duration` or `relative` formatted dates displaying dates in a tense other than the one specified. Setting `tense=past` will always display future `relative` dates as `now` and `duration` dates as `0 seconds`, while setting it to `future` will always display past dates `relative` as `now` and past `duration` dates as `0 seconds`.

For example when the given `datetime` is 40 seconds behind of the current date:

| `tense=`| format=duration  | format=relative |
|:-------:|:----------------:|:---------------:|
| future  | 0s               | now             |
| past    | 40s              | 40s ago         |
| auto    | 40s              | 40s ago         |

```html
<relative-time datetime="2038-04-01T16:30:00-08:00" tense="past">
  April 1, 2038 <!-- Will display "now" until April 1 2038 at 16:30:01! -->
</relative-time>
```

```html
<relative-time datetime="1970-04-01T16:30:00-08:00" tense="future">
  April 1, 2038 <!-- Will display "now" unless you had a time machine and went back to 1970 -->
</relative-time>
```

#### precision (`'year'|'month'|'day'|'hour'|'minute'|'second'`, default: `'second'`)

If `format` is `datetime` then this value will be ignored.

Precision can be used to limit the display of an `relative` or `duration` formatted time. By default times will display down to the `second` level of precision. Changing this value will truncate the display by zeroing out any unit lower than the given unit, as such units smaller than the given unit won't be displayed during `duration`, and `relative` will display `now` if the time away from the current time is less than the given precision unit.

| `precision=`  | format=duration     |
|:-------------:|:-------------------:|
| seconds       | 2y 6m 10d 3h 20m 8s |
| minutes       | 2y 6m 10d 3h 20m    |
| hours         | 2y 6m 10d 3h        |
| days          | 2y 6m 10d           |
| months        | 2y 6m               |
| years         | 2y                  |

| `precision=`  | format=relative     |
|:-------------:|:-------------------:|
| seconds       | 25 seconds          |
| minutes       | now                 |
| hours         | now                 |
| days          | now                 |
| months        | now                 |
| years         | now                 |


##### threshold (`string`, default: `P30D`)

If `tense` is anything other than `'auto'`, or `format` is `'relative'` (or the deprecated `'auto'` or `'micro'` values), then this value will be ignored.

Threshold can be used to specify when a relative display (e.g. "5 days ago") should turn into an absolute display (i.e. the full date). This should be a valid [ISO8601 Time Duration](https://en.wikipedia.org/wiki/ISO_8601#Durations). If the difference between the current time and the specified `datetime` is _more_ than the duration, then the date will be displayed as an absolute value (i.e. the full date), otherwise it will be formatted to a relative display (e.g. "5 days ago").

The default value for this is `P30D`, meaning if the current time is more than 30 days away from the specified date time, then an absolute date will be displayed.

```html
<relative-time datetime="1970-04-01T16:30:00-08:00" threshold="P100Y">
  <!-- Will display "<N> years ago" until 2070 when it will display "on April 1, 1970" -->
</relative-time>
```

```html
<relative-time datetime="1970-04-01T16:30:00-08:00" threshold="P0S">
  <!-- Will always display "on April 1, 1970" -->
</relative-time>
```

##### prefix (`string`, default: `'on'`)

If `tense` is anything other than `'auto'`, or `format` is anything other than `'relative'` (or the deprecated `'auto'` or `'micro'` values), then this value will be ignored.

When formatting an absolute date (see above `threshold` for more details) it can be useful to prefix the date with some text. The default value for this is `on` but it can be any string value, an will be prepended to the date.

```html
<relative-time datetime="1970-04-01T16:30:00-08:00" prefix="this happened on">
  <!-- Will always display "this happened on April 1, 1970" -->
</relative-time>
```

##### formatStyle (`'long'|'short'|'narrow'`, default: `'narrow'|'long'`)

This will used to determine the length of the unit names. This value is passed to the `Intl` objects as the `style` option. Some examples of how this can be used:

| `format=`  | `formatStyle=` | Display                  |
|:----------:|:--------------:|:------------------------:|
| relative   | long           | in 1 month               |
| relative   | short          | in 1 mo.                 |
| relative   | narrow         | in 1 mo.                 |
| duration   | long           | 1 month, 2 days, 4 hours |
| duration   | short          | 1 mth, 2 days, 4 hr      |
| duration   | narrow         | 1m 2d 4h                 |

##### second, minute, hour, weekday, day, month, year, timeZoneName

For dates outside of the specified `threshold`, the formatting of the date can be configured using these attributes. The values for these attributes are passed to [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat):

##### lang

Lang is a [built-in global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang). Relative Time will use this to provide an applicable language to the `Intl` APIs. If the individual element does not have a `lang` attribute then it will traverse upwards in the tree to find the closest element that does, or default the lang to `en`.

## Browser Support

Browsers without native [custom element support][support] require a [polyfill][ce-polyfill].

Browsers without native support for [`Intl.RelativeTimeFormat`][relativetimeformat] or [`Intl.DateTimeFormat`][datetimeformat] (such as Safari 13 or Edge 18) will also need polyfills.

- Chrome
- Firefox
- Safari (version 14 and above)
- Microsoft Edge (version 79 and above)

[support]: https://caniuse.com/custom-elementsv1
[relativetimeformat]: https://caniuse.com/mdn-javascript_builtins_intl_relativetimeformat_format
[datetimeformat]: https://caniuse.com/mdn-javascript_builtins_intl_datetimeformat_format
[ce-polyfill]: https://github.com/webcomponents/custom-elements

## See Also

Most of this implementation is based on Basecamp's [local_time](https://github.com/basecamp/local_time) component. Thanks to @javan for open sourcing that work and allowing for others to build on top of it.

@rmm5t's [jquery-timeago](https://github.com/rmm5t/jquery-timeago) is one of the old time-ago-in-words JS plugins.
