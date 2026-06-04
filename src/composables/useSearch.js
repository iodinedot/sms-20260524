// /src/composables/useSearch.js
import { computed } from 'vue'

export function useSearch({ list, query, maps }) {
  const buildSearchText = (item) => {
    // 🔥 全部加防炸（重點）
    const teacherName =
      maps?.value?.teachers?.[item.teacherId]?.name || ''

    const categoryName =
      maps?.value?.courseCategories?.[item.categoryId]?.name || ''

    return [
      item.name,
      item.description,
      teacherName,
      categoryName,
    ]
      .join(' ')
      .toLowerCase()
  }

  const filtered = computed(() => {
    const q = query.value?.toLowerCase() || ''

    if (!q) return list.value || []

    return (list.value || []).filter((item) =>
      buildSearchText(item).includes(q)
    )
  })

  return {
    filtered,
  }
}