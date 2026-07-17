<script setup>
import { ref, computed, watch, toRefs, toRef } from 'vue'
import { schemas } from '@/schemas'
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
  showTitle:{ type:Boolean, default:false }
})

const schema = schemas[props.type]

// ⭐ 1. 唯一搜尋來源
const keyword = ref('')

// ⭐ 2. data layer
const manager = useManager({
  type: props.type,
  schema,
  keyword
})

// ⭐ 3. 保持 reactive（不要亂解構）
const {
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
} = manager

// ⭐ 4. selection（依賴 data）
const selection = useTableSelection(dataFiltered)

const {
  selectedIds,
  clearSelection,
  isAllSelected,
  toggleSelect,
  toggleSelectAll
} = selection

// ⭐ 5. toolbar（純 UI）
const toolbarState = useToolbar({
  schema,
  type: props.type,
  keyword,
  selectedIds: selectedIds
})

const {
  mode,
  toolbar,
  selectedCount,
  batchActions
} = toolbarState
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
      :search="keyword"

      :mode="mode"
      :selectedCount="selectedCount"
      :batchActions="batchActions"

      @create="openCreate"
      @import="handleImport"
      @update:search="keyword = $event"

      @clear="clearSelection"
    />

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