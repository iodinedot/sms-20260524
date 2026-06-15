<script setup>
import { ref, computed, watch } from 'vue'
import { settingsSchema } from '@/schemas/settingsSchema'
import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useBatchActions } from '@/composables/useBatchActions'

import Toolbar from '@/components/base/Toolbar.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import SearchBar from '@/components/base/SearchBar.vue'
import ImportPreviewModal from '@/components/shared/ImportPreviewModal.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'
import BaseForm from '@/components/base/BaseForm.vue'

// ======================
// props + schema
// ======================
const props = defineProps({
  type: { type: String, required: true }
})

const schema = settingsSchema[props.type]

// ======================
// 🔥 replace useCrud → useManager
// ======================
const {
  list,
  dataFiltered,
  form,
  isOpen,
  isLoading,
  openCreate,
  openEdit,
  handleSave
} = useManager({
  type: props.type,
  schema,
  useSearch: true
})

// ======================
// search (useManager already handles filtering)
// ======================
const searchQuery = ref('')

watch(searchQuery, (val) => {
  // 如果 useManager 支援 search injection 就接這裡
})

// ======================
// selection (改用 filtered)
// ======================
const {
  selectedIds,
  isAllSelected,
  toggleSelect,
  toggleSelectAll,
  clearSelection
} = useTableSelection(dataFiltered)

// ======================
// batch actions (fix: dynamic type)
// ======================
const { batchDelete } = useBatchActions(props.type, {
  selectedIds
})

// ======================
// import
// ======================
const previewOpen = ref(false)
const previewData = ref([])

const handleImport = async (options = {}) => {
  const handler = schema.importConfig?.handler
  if (!handler) return

  const result = await handler({
    existingData: list.value,
    ...options
  })

  previewData.value = result
  previewOpen.value = true
}

const confirmImport = () => {
  previewData.value.forEach(item => handleSave(item))
  previewOpen.value = false
  previewData.value = []
}

// ======================
// filters (保留 schema-driven)
// ======================
const activeFilters = ref({})

const filterOptionsMap = computed(() => {
  const maps = {}
  if (!schema.filters) return maps

  Object.entries(schema.filters).forEach(([key, filterConfig]) => {
    if (typeof filterConfig.getOptions === 'function') {
      maps[key] = filterConfig.getOptions(list.value)
    } else {
      maps[key] = filterConfig.options || []
    }
  })
  return maps
})

// ======================
// UI helpers
// ======================
const fieldErrors = ref({})

const handleRowClick = (item) => {
  openEdit(item)
}

const handleCancel = () => {
  isOpen.value = false
  fieldErrors.value = {}
}
</script>

<template>
  <Toolbar
    :selectedCount="selectedIds.length"
    @add="openCreate"
    @batch-delete="batchDelete"
  >
    <template #search>
      <SearchBar v-model="searchQuery" />
      <div class="status-bar">
        <span v-if="searchQuery.trim()">
          🔍 找到 {{ dataFiltered.length }} 筆結果
        </span>
      </div>
    </template>
  </Toolbar>

  <TableRenderer
    :items="dataFiltered"
    :fields="schema.fields"
    selectable
    :selected-ids="selectedIds"
    :is-all-selected="isAllSelected"
    @toggle-select="toggleSelect"
    @toggle-select-all="toggleSelectAll"
    @row-click="handleRowClick"
    @edit="openEdit($event)"
  />

  <BaseForm
    :schema="schema"
    :errors="fieldErrors"
    v-model="form"
    v-model:isOpen="isOpen"
    @save="handleSave"
  />

  <div class="manager-actions-bar">
    <BaseButton
      icon="📥"
      text="匯入資料"
      v-if="schema.importConfig?.enabled"
      @click="handleImport"
    />

    <template v-if="schema.filters">
      <div
        v-for="[key, filterConfig] in Object.entries(schema.filters)"
        :key="key"
      >
        <select v-model="activeFilters[key]">
          <option value="">全部{{ filterConfig.label }}</option>
          <option
            v-for="opt in filterOptionsMap[key]"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>
    </template>
  </div>

  <ImportPreviewModal
    :open="previewOpen"
    :data="previewData"
    @confirm="confirmImport"
    @close="previewOpen = false"
  />
</template>