import { watch } from 'vue'

export function useCoursesApi(form, updateField) {

  // 🔵 schedule helpers
  const updateSchedule = (index, key, value) => {
    const list = [...(form.value.schedules || [])]
    console.log("useCoursesApi updateSchedule")
    console.log("index: ", index)
    console.log("key: ", key)
    console.log("value: ", value)
    console.log("form: ", form.value)
    if (!form.value || !form.value.schedules) {
      console.warn('⚠️ schedules 還沒初始化')
    }
    list[index] = {
      ...list[index],
      [key]: value
    }

    updateField('schedules', list)
  }

  const addSchedule = () => {
    const list = [...(form.value.schedules || [])]

    list.push({
      dayOfWeek: 1,
      startTime: '',
      endTime: ''
    })

    updateField('schedules', list)
  }

  const removeSchedule = (index) => {
    const list = [...(form.value.schedules || [])]

    list.splice(index, 1)

    updateField('schedules', list)
  }

  // 🔴 billingType logic
  watch(
    () => form.value.billingType,
    (newType) => {
      if (!newType) return

      if (newType === 'weekly-by-lesson') {
        updateField('fixedTotalAmount', 0)
      }

      if (newType === 'weekly-total' || newType === 'period-total') {
        if (!form.value.fixedTotalAmount) {
          updateField(
            'fixedTotalAmount',
            form.value.unitPrice || 0
          )
        }
      }
    }
  )

  return {
    updateSchedule,
    addSchedule,
    removeSchedule
  }
}