
export function getTodayLocalDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function toLocalDateString(input) {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isOverdue(dueDate) {
  const dueLocal = toLocalDateString(dueDate)
  if (!dueLocal) return false
  return dueLocal < getTodayLocalDateString()
}