# LocalTime Element
#
#= provides local-time
#
#= require CustomElements
#= require moment/moment
#
# Formats date as a localized string or as relative text that auto updates in
# the user's browser.
#
# ### Attributes
#
# datetime     - MUST be a ISO8601 String
# format       - A strftime token String
# title-format - A strftime token String
# from         - A String "now" or an ISO8601 string
#
# ### Examples
#
# ``` html
# <local-time datetime="<%= created_at.iso8601 %>" format="%m/%d/%y">
#   <%= created_at.to_date %>
# </local-time>
# ```
#
# ``` html
# <local-time datetime="<%= created_at.iso8601 %>" from="now">
#   <%= created_at.to_date %>
# </local-time>
# ```
#

ldml =
  a: 'ddd'
  A: 'dddd'
  b: 'MMM'
  B: 'MMMM'
  d: 'DD'
  H: 'HH'
  I: 'hh'
  j: 'DDDD'
  m: 'MM'
  M: 'mm'
  p: 'A'
  S: 'ss'
  z: 'ZZ'
  w: 'd'
  y: 'YY'
  Y: 'YYYY'
  '%': '%'

strftime = (date, format) ->
  momentFormat = format
  for key, value of ldml
    momentFormat = momentFormat.replace("%#{key}", value)
  moment(date).format momentFormat

# Internal: Parse ISO8601 String.
#
# str - String in ISO8601 format.
#
# Returns Moment or null if input is invalid.
parseISO8601 = (str) ->
  date = moment str, 'YYYY-MM-DDTHH:mm:ssZ'
  if date.isValid() then date.toDate() else null

# Internal: Format to from range as a relative time.
#
# to - Date
# from - Date (default: Date.now())
#
# Returns String.
formatFrom = (to, from = Date.now()) ->
  text = moment(to).from moment(from)
  if text is "a few seconds ago"
    "just now"
  else if text is "in a few seconds"
    "just now"
  else
    text

# Internal: Array tracking all elements attached to the document.
attachedInstances = []

# Public: Exposed as LocalTimeElement.prototype.
LocalTimePrototype = Object.create HTMLElement.prototype

# Internal: Initialize state.
#
# Returns nothing.
LocalTimePrototype.createdCallback = ->
  if value = @getAttribute 'datetime'
    @attributeChangedCallback 'datetime', null, value
  if value = @getAttribute 'from'
    @attributeChangedCallback 'from', null, value
  return

# Internal: Update internal state when any attribute changes.
#
# Returns nothing.
LocalTimePrototype.attributeChangedCallback = (attrName, oldValue, newValue) ->
  if attrName is 'datetime'
    @_date = parseISO8601 newValue

  if attrName is 'from'
    if newValue is 'now'
      @_fromNowDate = true
      @_fromDate = null
    else
      @_fromNowDate = false
      @_fromDate = parseISO8601 newValue

  if title = @getFormattedTitle()
    @setAttribute 'title', title

  if text = @getFormattedDate() or @getFormattedFromDate()
    @textContent = text

  return

# Internal: Run attached to document hooks.
#
# Track element for refreshing every minute.
#
# Returns nothing.
LocalTimePrototype.attachedCallback = ->
  attachedInstances.push this
  return

# Internal: Run detached from document hooks.
#
# Stops tracking element for time refreshes every minute.
#
# Returns nothing.
LocalTimePrototype.detachedCallback = ->
  i = attachedInstances.indexOf this
  if i isnt -1
    attachedInstances.splice i, 1
  return

# Public: Get formatted datetime.
#
# Returns String or null.
LocalTimePrototype.getFormattedDate = ->
  if @_date and @hasAttribute 'format'
    strftime @_date, @getAttribute 'format'

# Public: Get formatted from.
#
# Returns String or null.
LocalTimePrototype.getFormattedFromDate = ->
  if @_date and @hasAttribute 'from'
    formatFrom @_date, @_fromDate

# Public: Get formatted title string
#
# Returns String or null.
LocalTimePrototype.getFormattedTitle = ->
  if @_date and @hasAttribute 'title-format'
    strftime @_date, @getAttribute 'title-format'

# Internal: Install a timer to refresh all attached local-time elements every
# minute.
updateFromNowLocalTimeElements = ->
  for time in attachedInstances when time._date and time._fromNowDate
    time.textContent = time.getFormattedFromDate()
  return
setInterval updateFromNowLocalTimeElements, 60000


# Public: LocalTimeElement constructor.
#
#   time = new LocalTimeElement
#   # => <local-time></local-time>
#
window.LocalTimeElement = document.registerElement 'local-time',
  prototype: LocalTimePrototype
