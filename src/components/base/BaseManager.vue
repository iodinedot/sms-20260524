<script setup>
import { ref, computed, watch } from 'vue'
import { settingsSchema } from '@/schemas/settingsSchema'
import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useToolbar } from '@/composables/useToolbar'

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
  type: { type: String, required: true },
  schema: Object
})

const schema = computed(() => {
  return props.schema || settingsSchema[props.type]
})
const searchQuery = ref('')

// ======================
// 🔥 replace useCrud → useManager
// ======================
const {
  list,
  dataFiltered,
  activeFilters,
  errorFields,
  form,
  isOpen,
  isLoading,
  openCreate,
  openEdit,
  handleSave
} = useManager({
  type: props.type,
  schema,
  useSearch: true,
  keyword: searchQuery 
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

const {
  mode,
  selectedCount,
  toolbar,
  batchActions
} = useToolbar({
  schema,
  type: props.type,
  selectedIds,
  items: dataFiltered
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
const handleRowClick = (item) => {
  openEdit(item)
}

const handleCancel = () => {
  isOpen.value = false
  errorFields.value = {}
}
</script>

<template>
  <div class="manager-page">
    <Toolbar
        :toolbar="toolbar"
        :search="searchQuery"

        :mode="mode"
        :selectedCount="selectedCount"
        :batchActions="batchActions"

        @create="openCreate"
        @import="handleImport"
        @update:search="searchQuery = $event"

        @clear="clearSelection"
    >
      <!-- ✅ 4️⃣ 篩選（第二排） -->
      <template
        v-if="toolbar.filters.length"
        #filters
      >
        <div
          v-for="key in toolbar.filters"
          :key="key"
          class="filter-item"
        >
          <select v-model="activeFilters[key]">
            <option value="">
              全部{{ schema.filters[key].label }}
            </option>

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
    </Toolbar>

    <div class="table-wrapper">
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
      >
        <template #actions="{ item }">
          <slot name="row-actions" :item="item" />
        </template>
      </TableRenderer>
    </div>

    <div v-if="isOpen" class="modal">
      <slot
        name="form"
        :form="form"
        :isEditing="isEditing"
        :errorFields="errorFields"
        :handleSave="handleSave"
      >
        <!-- ✅ 預設 fallback -->
        <BaseForm
          :schema="schema"
          :errorFields="errorFields"
          v-model="form"
          v-model:isOpen="isOpen"
          @save="handleSave"
        />
      </slot>
    </div>
    
    <ImportPreviewModal
      :open="previewOpen"
      :data="previewData"
      @confirm="confirmImport"
      @close="previewOpen = false"
    />
  </div>
</template>