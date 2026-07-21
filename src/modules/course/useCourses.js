import { watch } from 'vue'

export function useCourses(form, updateField) {

  // 🔵 schedule helpers
  const updateSchedule = (index, key, value) => {
    const list = [...(form.value.schedules || [])]
    console.log("useCourses updateSchedule")
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
/*import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'

export function useCourses() {
  const { list } = useCrud('courses')

  // 🔥 核心：給 billing / enrollment 用
  const courseMap = computed(() => {
    const map = {}
    for (const c of list.value || []) {
      map[c.id] = c
    }
    return map
  })

  // （可選）單筆取得
  const getById = (id) => {
    return courseMap.value[id] || null
  }



  return {
    list,        // 給 UI（table / select）
    courseMap,   // 🔥 給計算（billing 用）
    getById      // 🔥 給邏輯（可選）
  }
}*/