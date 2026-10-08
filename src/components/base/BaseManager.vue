<script setup>
import { ref, computed, watch, toRefs, toRef } from 'vue'
import { schemas } from '@/schemas'
import { useManager } from '@/composables/useManager'
import { useTableSelection } from '@/composables/useTableSelection'
import { useToolbar } from '@/composables/useToolbar'

import Toolbar from '@/components/base/Toolbar.vue'
import TableRenderer from '@/components/shared/TableRenderer.vue'
import BaseForm from '@/components/base/BaseForm.vue'
import BatchAddModal from '@/components/shared/BatchAddModal.vue'

// ======================
// props + schema
// ======================
const props = defineProps({
  type: { type: String, required: true },
  showTitle: { type: Boolean, default: false },
  extraColumns: { type: Array, default: () => [] }  // 新增
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
  selectedIds: selectedIds,
  items: dataFiltered
})

const {
  mode,
  toolbar,
  filters,
  selectedCount,
  batchActions
} = toolbarState

const updateFilter = ({ key, value }) => {
  activeFilters.value = {
    ...activeFilters.value,
    [key]: value
  }
}

// ======================
// batch add
// ======================
const batchOpen = ref(false)
const batchText = ref('')
const batchResult = ref(null) // { successCount, failed: [{ line, error }] }

const openBatchAdd = () => {
  batchText.value = ''
  batchResult.value = null
  batchOpen.value = true
}

const closeBatchAdd = () => {
  batchOpen.value = false
  batchText.value = ''
  batchResult.value = null
}

const submitBatchAdd = async () => {
  const lines = batchText.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return

  const failed = []
  let successCount = 0

  for (const line of lines) {
    openCreate()          // 沿用原本新增邏輯，補上 createdAt 等隱藏欄位
    isOpen.value = false  // 不要跳出新增用的 modal
    form.value = {
      ...form.value,
      name: line
    }

    try {
      const ok = await handleSave()
      if (ok) {
        successCount++
      } else {
        failed.push({ line, error: '欄位驗證失敗或儲存失敗' })
      }
    } catch (err) {
      failed.push({ line, error: err?.message || '儲存失敗' })
    }
  }

  if (failed.length === 0) {
    closeBatchAdd()
  } else {
    batchText.value = failed.map(f => f.line).join('\n')
    batchResult.value = { successCount, failed }
  }
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
      :mode="mode"
      :selectedCount="selectedCount"
      :toolbar="toolbar"
      :filters="filters"
      :activeFilters="activeFilters"
      :batchActions="batchActions"
      :search="keyword"
      @create="openCreate"
      @batch-add="openBatchAdd"
      @update:search="keyword = $event"
      @update:filter="updateFilter"
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
        :extra-columns="extraColumns"
        selectable
        :selectedIds="selectedIds"
        :is-all-selected="isAllSelected"
        @toggle-select="toggleSelect"
        @toggle-select-all="toggleSelectAll"
        @row-click="openEdit"
        @edit="openEdit"
      >
      <!-- 把每個 extraColumns 對應的 slot 動態轉發下去 -->
        <template
          v-for="col in extraColumns"
          :key="col.key"
          #[`extra-${col.key}`]="slotProps"
        >
          <slot :name="`extra-${col.key}`" v-bind="slotProps" />
        </template>

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
      <BaseForm
        :schema="schema"
        :errorFields="errorFields"
        v-model="form"
        @save="handleSave"
        @close="close"
      >
        <slot
          name="form-extra"
          :form="form"
          :updateField="updateField"
        />
      </BaseForm>
    </div>
  </div>

  <BatchAddModal
    :open="batchOpen"
    v-model="batchText"
    :result="batchResult"
    @submit="submitBatchAdd"
    @close="closeBatchAdd"
  />
</template>