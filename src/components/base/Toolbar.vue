<script setup>
import BaseButton from '@/components/base/BaseButton.vue';
import SearchBar from '@/components/base/SearchBar.vue'
import FilterTabs from '@/components/base/FilterTabs.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'normal'
  },
  selectedCount: Number,
  toolbar: {
    type: Object,
    default: () => ({})
  },
  batchActions: {
    type: Array,
    default: () => []
  },
  search: {
    type: String,
    default: ''
  },
  filters: {
    type: Array,
    default: () => []
  },
  activeFilters: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits([
  'create',
  'import',
  'clear',
  'update:search',
  'update:filter'
])

// filter handler
const toggleFilter = (filterKey, value) => {
  const current = props.activeFilters[filterKey] || []

  let next

  if (current.includes(value)) {
    next = current.filter(v => v !== value)
  } else {
    next = [
      ...current,
      value
    ]
  }

  emit('update:filter', {
    key: filterKey,
    value: next
  })
}
</script>

<template>
  <div class="manager-toolbar">

    <!-- 🟢 NORMAL MODE -->
    <template v-if="mode === 'normal'">

      <!-- 🔹 第一排：主操作優先 -->
      <div class="toolbar-row">
        <!-- 左：主要操作 -->
        <div class="toolbar-primary">
          <BaseButton
              v-if="props.toolbar.create"
              text="新增"
              @click="$emit('create')"
          />
          <slot name="primary-actions"/>
          <div class="toolbar-secondary-actions">
              <BaseButton
                  v-if="props.toolbar.import"
                  text="匯入資料"
                  icon="📥"
                  variant="outline"
                  @click="$emit('import')"
              />
              <slot name="actions"/>
          </div>
        </div>

        <!-- 右：搜尋 -->
        <div
            v-if="props.toolbar.search"
            class="toolbar-search"
        >
          <SearchBar
              :modelValue="search"
              @update:modelValue="$emit('update:search',$event)"
          />
          <slot name="search"/>
        </div>
      </div>

      <!-- 🔹 第二排：filters -->
      <FilterTabs
        v-if="filters?.length"
        :filters="filters"
        :activeFilters="activeFilters"
        @update:filter="$emit('update:filter', $event)"
      />

    </template>

    <!-- 🔴 BATCH MODE -->
    <template v-else>

      <div class="toolbar-row">

        <!-- 左：選取資訊 -->
        <div class="batch-info">
          已選 {{ selectedCount }} 筆
        </div>

        <!-- 右：批次操作 -->
        <div class="toolbar-actions">

          <!-- 👉 未來可以改 dropdown -->
          <template v-if="batchActions?.length <= 3">
            <BaseButton
              v-for="action in batchActions"
              :key="action.key"
              :text="action.label"
              :variant="action.type || 'primary'"
              :disabled="action.enabled === false"
              @click="action.handler"
            />
          </template>

          <!-- 👉 多於3個，建議用單一入口 -->
          <template v-else>
            <BaseButton
              text="批次操作"
              @click="batchActions[0]?.handler"
            />
          </template>

          <BaseButton
            text="清除"
            variant="outline"
            @click="$emit('clear')"
          />
        </div>
      </div>
    </template>
  </div>
</template>