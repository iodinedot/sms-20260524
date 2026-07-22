<script setup>
import BaseButton from '@/components/base/BaseButton.vue'

const props = defineProps({
  filters: Array,
  activeFilters: Object
})

const emit = defineEmits(['update:filter'])

const toggleFilter = (key, value) => {
  const current = props.activeFilters[key] || []

  const next = current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value]

  emit('update:filter', {
    key,
    value: next
  })
}

const clearFilter = (key) => {
  emit('update:filter', {
    key,
    value: []
  })
}

const isSelected = (key, value) => {
  const selected = props.activeFilters[key]
  return Array.isArray(selected)
    ? selected.includes(value)
    : false
}

const isAllSelected = (key) => {
  const selected = props.activeFilters[key]
  return !selected || selected.length === 0
}
</script>

<template>
  <div class="filter-tabs">
    <div
      v-for="filter in filters"
      :key="filter.key"
      class="filter-group"
    >
      <div class="filter-label">
        {{ filter.label }}
      </div>

      <div class="filter-options">
        <!-- 全部 -->
        <BaseButton
          text="全部"
          mode="text"
          variant="outline"
          :class="{
            'is-active': isAllSelected(filter.key)
          }"
          @click="clearFilter(filter.key)"
        />

        <!-- options -->
        <BaseButton
          v-for="opt in filter.options"
          :key="opt.value"
          :text="opt.label"
          mode="text"
          variant="outline"
          :class="{
            'is-active': isSelected(filter.key, opt.value)
          }"
          @click="toggleFilter(filter.key, opt.value)"
        />
      </div>
    </div>
  </div>
</template>