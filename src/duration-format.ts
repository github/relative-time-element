export const unitNames = ['second', 'minute', 'hour', 'day', 'month', 'year'] as const
export type Unit = typeof unitNames[number]

export function timeAgo(date: Date): [number, Unit] {
  const ms = new Date().getTime() - date.getTime()
  const sec = Math.round(ms / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(month / 12)
  if (ms < 0) {
    return [0, 'second']
  } else if (sec < 10) {
    return [0, 'second']
  } else if (sec < 45) {
    return [-sec, 'second']
  } else if (sec < 90) {
    return [-min, 'minute']
  } else if (min < 45) {
    return [-min, 'minute']
  } else if (min < 90) {
    return [-hr, 'hour']
  } else if (hr < 24) {
    return [-hr, 'hour']
  } else if (hr < 36) {
    return [-day, 'day']
  } else if (day < 30) {
    return [-day, 'day']
  } else if (month < 18) {
    return [-month, 'month']
  } else {
    return [-year, 'year']
  }
}

export function microTimeAgo(date: Date): [number, Unit] {
  const ms = new Date().getTime() - date.getTime()
  const sec = Math.round(ms / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(month / 12)
  if (min < 1) {
    return [1, 'minute']
  } else if (min < 60) {
    return [min, 'minute']
  } else if (hr < 24) {
    return [hr, 'hour']
  } else if (day < 365) {
    return [day, 'day']
  } else {
    return [year, 'year']
  }
}

export function timeUntil(date: Date): [number, Unit] {
  const ms = date.getTime() - new Date().getTime()
  const sec = Math.round(ms / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(month / 12)
  if (month >= 18) {
    return [year, 'year']
  } else if (month >= 12) {
    return [year, 'year']
  } else if (day >= 45) {
    return [month, 'month']
  } else if (day >= 30) {
    return [month, 'month']
  } else if (hr >= 36) {
    return [day, 'day']
  } else if (hr >= 24) {
    return [day, 'day']
  } else if (min >= 90) {
    return [hr, 'hour']
  } else if (min >= 45) {
    return [hr, 'hour']
  } else if (sec >= 90) {
    return [min, 'minute']
  } else if (sec >= 45) {
    return [min, 'minute']
  } else if (sec >= 10) {
    return [sec, 'second']
  } else {
    return [0, 'second']
  }
}

export function microTimeUntil(date: Date): [number, Unit] {
  const ms = date.getTime() - new Date().getTime()
  const sec = Math.round(ms / 1000)
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  const month = Math.round(day / 30)
  const year = Math.round(month / 12)
  if (day >= 365) {
    return [year, 'year']
  } else if (hr >= 24) {
    return [day, 'day']
  } else if (min >= 60) {
    return [hr, 'hour']
  } else if (min > 1) {
    return [min, 'minute']
  } else {
    return [1, 'minute']
  }
}

export function elapsedTime(date: Date): Array<[number, Unit]> {
  const ms = Math.abs(date.getTime() - new Date().getTime())
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const month = Math.floor(day / 30)
  const year = Math.floor(month / 12)
  const units: Array<[number, Unit]> = []
  if (year) units.push([year, 'year'])
  if (month - year * 12) units.push([month - year * 12, 'month'])
  if (day - month * 30) units.push([day - month * 30, 'day'])
  if (hr - day * 24) units.push([hr - day * 24, 'hour'])
  if (min - hr * 60) units.push([min - hr * 60, 'minute'])
  if (sec - min * 60) units.push([sec - min * 60, 'second'])
  return units
}
