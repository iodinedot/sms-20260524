<script setup>
import { computed, ref } from 'vue'
import { useSearch } from '@/composables/useSearch'
const props = defineProps({
  items: Array,
  modelValue: Array,
  labelKey: {
    type: String,
    default: 'name'
  },
  getLabel: Function   // 🔥 新增這個
})

const emit = defineEmits(['update:modelValue'])

// ✅ 防 undefined
const safeItems = computed(() => props.items || [])
const safeSelected = computed(() => props.modelValue || [])

// ✅ set
const selectedSet = computed(() => new Set(safeSelected.value))

// ========================
// 分組
// ========================
const leftItems = computed(() =>
  safeItems.value.filter(i => !selectedSet.value.has(i.id))
)

const rightItems = computed(() =>
  safeItems.value.filter(i => selectedSet.value.has(i.id))
)

const totalCount = computed(() => props.items.length)

const leftCount = computed(() => filteredLeft.value.length)
const rightCount = computed(() => filteredRight.value.length)

// ========================
// 搜尋
// ========================
const leftKeyword = ref('')
const rightKeyword = ref('')

const filteredLeft = useSearch(
  leftItems,
  leftKeyword,
  (item) => item?.[props.labelKey]
)

const filteredRight = useSearch(
  rightItems,
  rightKeyword,
  (item) => item?.[props.labelKey]
)

// ========================
// actions
// ========================
const add = (id) => {
  if (selectedSet.value.has(id)) return

  emit('update:modelValue', [
    ...safeSelected.value,
    id
  ])
}

const remove = (id) => {
  emit(
    'update:modelValue',
    safeSelected.value.filter(i => i !== id)
  )
}

const formatLabel = (item) => {
  return `${item.name}（${item.code || item.grade || item.id}）`
}
</script>

<template>
  <div class="dual-list">
    <!-- LEFT -->
    <div class="list">
      <div class="list-header">
        未修課（{{ leftCount }} / {{ totalCount }}）
      </div>

      <input v-model="leftKeyword" placeholder="搜尋未選..." />

      <div class="list-items">
        <div
          v-for="item in filteredLeft"
          :key="item.id"
          class="item"
          @click="add(item.id)"
        >
          {{ getLabel ? getLabel(item) : item[labelKey] }}
        </div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="list">
      <div class="list-header">
        已修課（{{ rightCount }} / {{ totalCount }}）
      </div>

      <input v-model="rightKeyword" placeholder="搜尋已選..." />

      <div class="list-items">
        <div
          v-for="item in filteredRight"
          :key="item.id"
          class="item"
          @click="remove(item.id)"
        >
          {{ getLabel ? getLabel(item) : item[labelKey] }}
        </div>
      </div>
    </div>

  </div>
</template>