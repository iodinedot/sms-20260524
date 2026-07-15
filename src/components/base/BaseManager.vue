<script setup>
import { ref, computed, watch, toRef } from 'vue'
import { settingsSchema } from '@/schemas/settingsSchema'
import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useToolbar } from '@/composables/useToolbar'

import Toolbar from '@/components/base/Toolbar.vue'
import ImportPreviewModal from '@/components/shared/ImportPreviewModal.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'
import BaseForm from '@/components/base/BaseForm.vue'

// ======================
// props + schema
// ======================
const props = defineProps({
  type: { type: String, required: true },
  schema: Object,  
  showTitle:{ type:Boolean, default:false }
})

const schema = computed(() => {
  return props.schema || settingsSchema[props.type]
})
const searchQuery = ref('')

const {
    // data
    list,
    activeFilters,
    dataFiltered,
    form,
    isOpen,
    isLoading,
    isEditing,
    errorFields,
    updateField,
    openCreate,
    openEdit,
    openCopy,
    handleSave,
    close
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
} = useTableSelection(toRef(dataFiltered))

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
    existingData: list,
    ...options
  })

  previewData = result
  previewOpen = true
}

const confirmImport = () => {
  previewData.forEach(item => handleSave(item))
  previewOpen = false
  previewData = []
}

// ======================
// filters (保留 schema-driven)
// ======================
const filterOptionsMap = computed(() => {
  const maps = {}
  if (!schema.filters) return maps

  Object.entries(schema.filters).forEach(([key, filterConfig]) => {
    if (typeof filterConfig.getOptions === 'function') {
      maps[key] = filterConfig.getOptions(list)
    } else {
      maps[key] = filterConfig.options || []
    }
  })
  return maps
})
</script>

<template>
  <div class="manager-page">
    <h3
      v-if="showTitle"
      class="page-title"
    >
      {{ schema.title }}
    </h3>
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
              :key="opt"
              :value="opt"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
      </template>
    </Toolbar>

    <div class="table-wrapper">
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="loading-overlay"
      >
        <div class="spinner"></div>
        <p>資料同步中...</p>
      </div>

      <TableRenderer
        v-else-if="dataFiltered.length > 0"
        :items="dataFiltered"
        :fields="schema.fields"
        selectable
        :selected-ids="selectedIds"
        :is-all-selected="isAllSelected"
        @toggle-select="toggleSelect"
        @toggle-select-all="toggleSelectAll"
        @row-click="openEdit"
        @edit="openEdit"
      >
        <template #actions="{ item }">
          <slot
            name="actions"
            :item="item"
            :openCreate="openCreate"
            :openEdit="openEdit"
            :openCopy="openCopy"
            :isEditing="isEditing"
          />  
        </template>
      </TableRenderer>
      <!-- Empty -->
      <div
        v-else
        class="empty-state"
      >
        {{ schema.emptyText || '目前沒有資料' }}
      </div>
    </div>
    <div v-if="isOpen" class="modal">
      <slot
        name="form"
        :form="form"
        :setForm="val => form = val"
        :errorFields="errorFields"
        :updateField="updateField"
        :save="handleSave"
        :close="close"
        :isEditing="isEditing"
      >
        <!-- default -->
        <BaseForm
          :schema="schema"
          :errorFields="errorFields"
          v-model="form"
          @save="handleSave"
          @close="close"
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