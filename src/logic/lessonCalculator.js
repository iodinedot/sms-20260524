export const calculateLessonCount = ({
    startDate,
    endDate,
    excludedDates = [],
    weeklyDays = [] // e.g. [1,3,5] Monday/Wednesday/Friday
  }) => {
    if (!startDate || !endDate) return 0
  
    const start = new Date(startDate)
    const end = new Date(endDate)
  
    let count = 0
    const current = new Date(start)
  
    while (current <= end) {
      const day = current.getDay() // 0=Sun ... 6=Sat
  
      const isTeachingDay = weeklyDays.length
        ? weeklyDays.includes(day)
        : true
  
      const dateStr = current.toISOString().split('T')[0]
      const isExcluded = excludedDates.includes(dateStr)
  
      if (isTeachingDay && !isExcluded) {
        count++
      }
  
      current.setDate(current.getDate() + 1)
    }
  
    return count
  }