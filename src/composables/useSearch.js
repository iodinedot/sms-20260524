import { computed } from 'vue'
import { filterByKeyword } from '@/logic/search'

export function useSearch(listRef, keywordRef, getText) {
  return computed(() => filterByKeyword(listRef.value, keywordRef.value, getText))
}