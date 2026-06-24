// src/composables/useTableSelection.js
import { ref, computed, watch } from 'vue';

export function useTableSelection(filteredItemsRef) {
  const selectedIds = ref([]);

  const toggleSelect = (id) => {
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(i => i !== id)
    } else {
      selectedIds.value.push(id)
    }
  }

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

  watch(
    filteredItemsRef,
    (list) => {
      const validIds = list.map(item => item.id)
  
      selectedIds.value = selectedIds.value.filter(id =>
        validIds.includes(id)
      )
    },
    { deep: true }
  )

  return { selectedIds, toggleSelect, isAllSelected, toggleSelectAll, clearSelection };
}