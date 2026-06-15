// /src/composables/useSearch.js
import { computed } from 'vue'

export function useSearch(listRef, keywordRef, getText) {
  return computed(() => {
    const list = listRef.value || []
    const kw = keywordRef.value?.toLowerCase() || ''

    if (!kw) return list

    return list.filter(item =>
      String(getText(item) || '')
        .toLowerCase()
        .includes(kw)
    )
  })
}