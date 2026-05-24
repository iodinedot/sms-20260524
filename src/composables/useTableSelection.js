// src/composables/useTableSelection.js
import { ref, computed } from 'vue';

export function useTableSelection(filteredItemsRef) {
  const selectedIds = ref([]);

  const isAllSelected = computed(() => {
    return (
      filteredItemsRef.value.length > 0 &&
      selectedIds.value.length === filteredItemsRef.value.length
    );
  });

  const toggleSelectAll = (e) => {
    selectedIds.value = e.target.checked
      ? filteredItemsRef.value.map((item) => item.id)
      : [];
  };

  const clearSelection = () => {
    selectedIds.value = [];
  };

  return { selectedIds, isAllSelected, toggleSelectAll, clearSelection };
}