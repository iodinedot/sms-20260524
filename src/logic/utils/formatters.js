import { WEEKDAY_OPTIONS } from '@/constants/options'

/**
 * 📅 Date Period
 */
export const formatDatePeriod = (value, mode = 'range') => {
  if (!value) return ''

  const { start, end, label } = value

  if (mode === 'label') {
    return label || (start && end ? `${start} ~ ${end}` : '')
  }

  if (mode === 'range') {
    if (start && end) return `${start} ~ ${end}`
    if (start) return start
    if (end) return end
    return ''
  }

  if (mode === 'start') return start || ''
  if (mode === 'end') return end || ''

  return ''
}


/**
 * 🕒 Time Period Array（你新的命名 👍）
 */
export const formatTimePeriodArray = (value, mode = 'range') => {
  if (!Array.isArray(value)) return ''

  return value
    .map(v => {
      const day =
        WEEKDAY_OPTIONS.find(d => d.value === v.dayOfWeek)?.label || ''

      if (mode === 'label' || mode === 'range') {
        return `${day} ${v.startTime}-${v.endTime}`
      }

      return `${v.startTime}-${v.endTime}`
    })
    .join('\n')
}