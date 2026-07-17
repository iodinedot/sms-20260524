// /src/composables/useSearch.js
import { computed } from 'vue'

export function useSearch(listRef, keywordRef, getText) {
  return computed(() => {
    const list = listRef.value || []
    const keyword = keywordRef.value?.toLowerCase() || ''
    if (!keyword) return list

    return list.filter(item => {
      const text = String(getText(item) || '').toLowerCase()
      const match = text.includes(keyword)
    
      return match
    })
  })
}