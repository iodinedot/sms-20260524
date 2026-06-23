export const formatPeriod = (value, mode = 'range') => {
    //console.log(value, mode)
    if (!value) return ''
  
    const { start, end, label } = value
  
    // 👉 強制拿 label
    if (mode === 'label') {
      return label || (start && end ? `${start} ~ ${end}` : '')
    }
  
    // 👉 拿 raw period string
    if (mode === 'range') {
      if (start && end) return `${start} ~ ${end}`
      if (start) return start
      if (end) return end
      return ''
    }

    if (mode === 'start') {
      if (start) return start
      return ''
    }

    if (mode === 'end') {
      if (end) return end
      return ''
    }
  
    return ''
  }