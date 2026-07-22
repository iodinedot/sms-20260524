// src/composables/useTableSelection.js
import { ref, computed, watch } from 'vue';

export function useTableSelection(
  itemsRef,
  options = {}
) {
  const selectedIds = ref([]);
  const {
    preserveSelection = false
  } = options

  const toggleSelect = (id) => {
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(i => i !== id)
    } else {
      selectedIds.value.push(id)
    }
  }

  const isAllSelected = computed(() => {
    return (
      itemsRef.value.length > 0 &&
      selectedIds.value.length === itemsRef.value.length
    );
  });

  const toggleSelectAll = (e) => {
    /*console.log('[toggleSelectAll]', {
      checked: e.target.checked,
      itemsRef: itemsRef.value,
      isArray: Array.isArray(itemsRef.value)
    })*/
    selectedIds.value = e.target.checked
      ? itemsRef.value.map((item) => item.id)
      : [];
  };

  const clearSelection = () => {
    selectedIds.value = [];
  };

  watch(
    itemsRef,
    (list) => {
  
      // 🔥 保留跨 filter 的選取
      if (preserveSelection) {
        return
      }
  
      const validIds = list.map(item => item.id)
  
      selectedIds.value = selectedIds.value.filter(id =>
        validIds.includes(id)
      )
    },
    { deep: true }
  )

  return { selectedIds, toggleSelect, isAllSelected, toggleSelectAll, clearSelection };
}