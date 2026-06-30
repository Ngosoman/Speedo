export function addDaysToDate(dateText, numberOfDays) {
  const date = new Date(dateText)
  date.setDate(date.getDate() + Number(numberOfDays || 0))
  return date.toISOString().slice(0, 10)
}

export function toDateTimeText(dateText, timeText) {
  return `${dateText}T${timeText}:00`
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function nowIsoDateTime() {
  return new Date().toISOString()
}
