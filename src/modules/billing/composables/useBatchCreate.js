import { computed } from 'vue'
import { useBilling } from '@/modules/billing/composables/useBilling'

export function useBatchCreate({ selectedIds, period }) {
  const {
    buildDraftPreview,
    getStudentCourseCount
  } = useBilling()

  const previewList = computed(() => {
    if (!period.value.start || !period.value.end) return []
    if (!selectedIds.value.length) return []

    return buildDraftPreview({
      studentIds: selectedIds.value,
      period: period.value
    })
  })

  const previewMap = computed(() => {
    const map = {}
    for (const item of previewList.value) {
      map[item.studentId] = item
    }
    return map
  })

  const previewSummary = computed(() => {
    let total = previewList.value.length
    let newCount = 0
    let duplicates = 0
    let totalAmount = 0

    for (const item of previewList.value) {
      if (item.status === 'duplicate') {
        duplicates++
      } else {
        newCount++
        totalAmount += item.total || 0
      }
    }

    return {
      total,
      newCount,
      duplicates,
      totalAmount
    }
  })

  return {
    previewList,
    previewMap,
    previewSummary,
    getStudentCourseCount
  }
}